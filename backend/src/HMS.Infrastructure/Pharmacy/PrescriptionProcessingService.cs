using HMS.Application.Pharmacy;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Pharmacy;

public class PrescriptionProcessingService(ApplicationDbContext db) : IPrescriptionProcessingService
{
    public async Task<IReadOnlyList<PendingPrescriptionDto>> GetPendingAsync(CancellationToken ct = default) =>
        await MapQuery(db.PrescriptionItems.Where(p => p.Status == PrescriptionItemStatus.Pending)).ToListAsync(ct);

    public async Task<IReadOnlyList<PendingPrescriptionDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default) =>
        await MapQuery(db.PrescriptionItems.Where(p => p.MedicalRecord!.PatientId == patientId)).ToListAsync(ct);

    private IQueryable<PendingPrescriptionDto> MapQuery(IQueryable<Domain.Entities.PrescriptionItem> source) =>
        from p in source
        join m in db.MedicalRecords on p.MedicalRecordId equals m.Id
        join pat in db.Patients on m.PatientId equals pat.Id
        orderby m.CreatedAtUtc
        select new PendingPrescriptionDto(
            p.Id, m.Id, pat.Id, pat.FullName, p.MedicineName, p.Dosage, p.Frequency, p.DurationDays, p.Instructions,
            p.Status.ToString(), m.CreatedAtUtc);

    public async Task<DispenseResult> DispenseAsync(int prescriptionItemId, DispenseRequest request, CancellationToken ct = default)
    {
        var item = await db.PrescriptionItems.FindAsync([prescriptionItemId], ct);
        if (item is null) return DispenseResult.PrescriptionNotFound;
        if (item.Status != PrescriptionItemStatus.Pending) return DispenseResult.InvalidState;

        var medicine = await db.Medicines.FindAsync([request.MedicineId], ct);
        if (medicine is null) return DispenseResult.MedicineNotFound;
        if (medicine.StockQuantity < request.Quantity) return DispenseResult.InsufficientStock;

        medicine.StockQuantity -= request.Quantity;
        item.Status = PrescriptionItemStatus.Dispensed;
        item.DispensedMedicineId = medicine.Id;
        item.DispensedQuantity = request.Quantity;
        item.UnitPriceAtDispense = medicine.UnitPrice;
        item.DispensedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return DispenseResult.Success;
    }

    public async Task<bool> CancelAsync(int prescriptionItemId, CancellationToken ct = default)
    {
        var item = await db.PrescriptionItems.FindAsync([prescriptionItemId], ct);
        if (item is null || item.Status != PrescriptionItemStatus.Pending) return false;

        item.Status = PrescriptionItemStatus.Cancelled;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
