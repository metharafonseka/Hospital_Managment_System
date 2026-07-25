using HMS.Application.Billing;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Billing;

public class BillingService(ApplicationDbContext db) : IBillingService
{
    public async Task<IReadOnlyList<InvoiceDto>> GetAllAsync(int? patientId, string? status, CancellationToken ct = default)
    {
        var query = LoadQuery();
        if (patientId is not null) query = query.Where(i => i.PatientId == patientId);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<InvoiceStatus>(status, true, out var parsed))
            query = query.Where(i => i.Status == parsed);

        var invoices = await query.OrderByDescending(i => i.CreatedAtUtc).ToListAsync(ct);
        return invoices.Select(Map).ToList();
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var invoice = await LoadQuery().FirstOrDefaultAsync(i => i.Id == id, ct);
        return invoice is null ? null : Map(invoice);
    }

    public async Task<(GenerateInvoiceResult, InvoiceDto?)> GenerateAsync(
        GenerateInvoiceRequest request, CancellationToken ct = default)
    {
        var patient = await db.Patients.FindAsync([request.PatientId], ct);
        if (patient is null) return (GenerateInvoiceResult.PatientNotFound, null);

        var consultationCharges = await db.MedicalRecords
            .Where(m => m.PatientId == request.PatientId)
            .Where(m => !db.InvoiceLineItems.Any(li => li.ChargeType == ChargeType.Consultation && li.SourceReferenceId == m.Id))
            .Join(db.Doctors, m => m.DoctorId, d => d.Id, (m, d) => new { m.Id, d.ConsultationFee })
            .ToListAsync(ct);

        var labCharges = await db.LabTestRequests
            .Where(l => l.PatientId == request.PatientId && l.Status == LabTestStatus.Completed)
            .Where(l => !db.InvoiceLineItems.Any(li => li.ChargeType == ChargeType.Laboratory && li.SourceReferenceId == l.Id))
            .Select(l => new { l.Id, l.TestName, l.Price })
            .ToListAsync(ct);

        var pharmacyCharges = await db.PrescriptionItems
            .Where(p => p.Status == PrescriptionItemStatus.Dispensed && p.MedicalRecord!.PatientId == request.PatientId)
            .Where(p => !db.InvoiceLineItems.Any(li => li.ChargeType == ChargeType.Pharmacy && li.SourceReferenceId == p.Id))
            .Select(p => new { p.Id, p.MedicineName, Amount = (p.DispensedQuantity ?? 0) * (p.UnitPriceAtDispense ?? 0) })
            .ToListAsync(ct);

        var lineItems = new List<InvoiceLineItem>();
        lineItems.AddRange(consultationCharges.Select(c => new InvoiceLineItem
        {
            ChargeType = ChargeType.Consultation, Description = "Consultation fee", Amount = c.ConsultationFee, SourceReferenceId = c.Id
        }));
        lineItems.AddRange(labCharges.Select(l => new InvoiceLineItem
        {
            ChargeType = ChargeType.Laboratory, Description = $"Lab test: {l.TestName}", Amount = l.Price, SourceReferenceId = l.Id
        }));
        lineItems.AddRange(pharmacyCharges.Select(p => new InvoiceLineItem
        {
            ChargeType = ChargeType.Pharmacy, Description = $"Medicine: {p.MedicineName}", Amount = p.Amount, SourceReferenceId = p.Id
        }));
        lineItems.AddRange(request.AdditionalLineItems.Select(m => new InvoiceLineItem
        {
            ChargeType = ChargeType.Other, Description = m.Description, Amount = m.Amount
        }));

        if (lineItems.Count == 0) return (GenerateInvoiceResult.NothingToBill, null);

        var invoice = new Invoice
        {
            PatientId = request.PatientId,
            TotalAmount = lineItems.Sum(l => l.Amount),
            LineItems = lineItems
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        var dto = await GetByIdAsync(invoice.Id, ct);
        return (GenerateInvoiceResult.Success, dto);
    }

    public async Task<(RecordPaymentResult, InvoiceDto?)> RecordPaymentAsync(
        int invoiceId, RecordPaymentRequest request, CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FindAsync([invoiceId], ct);
        if (invoice is null) return (RecordPaymentResult.InvoiceNotFound, null);
        if (invoice.AmountPaid + request.Amount > invoice.TotalAmount) return (RecordPaymentResult.ExceedsBalance, null);

        db.Payments.Add(new Payment { InvoiceId = invoiceId, Amount = request.Amount, Method = request.Method });
        invoice.AmountPaid += request.Amount;
        invoice.Status = invoice.AmountPaid >= invoice.TotalAmount
            ? InvoiceStatus.Paid
            : invoice.AmountPaid > 0
                ? InvoiceStatus.PartiallyPaid
                : InvoiceStatus.Unpaid;

        await db.SaveChangesAsync(ct);

        var dto = await GetByIdAsync(invoiceId, ct);
        return (RecordPaymentResult.Success, dto);
    }

    private IQueryable<Invoice> LoadQuery() =>
        db.Invoices.Include(i => i.Patient).Include(i => i.LineItems).Include(i => i.Payments);

    private static InvoiceDto Map(Invoice i) => new(
        i.Id, i.PatientId, i.Patient!.FullName, i.CreatedAtUtc, i.Status.ToString(), i.TotalAmount, i.AmountPaid,
        i.LineItems.Select(l => new InvoiceLineItemDto(l.Id, l.ChargeType.ToString(), l.Description, l.Amount)).ToList(),
        i.Payments.OrderBy(p => p.PaidAtUtc).Select(p => new PaymentDto(p.Id, p.Amount, p.Method, p.PaidAtUtc)).ToList());
}
