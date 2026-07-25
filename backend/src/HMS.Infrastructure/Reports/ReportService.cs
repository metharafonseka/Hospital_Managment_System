using HMS.Application.Pharmacy;
using HMS.Application.Reports;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Reports;

public class ReportService(ApplicationDbContext db) : IReportService
{
    public async Task<PatientReportDto> GetPatientReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var total = await db.Patients.CountAsync(ct);

        var newRegQuery = db.Patients.AsQueryable();
        if (from is not null) newRegQuery = newRegQuery.Where(p => p.CreatedAtUtc >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to is not null) newRegQuery = newRegQuery.Where(p => p.CreatedAtUtc <= to.Value.ToDateTime(TimeOnly.MaxValue));
        var newRegistrations = await newRegQuery.CountAsync(ct);

        var byGenderRaw = await db.Patients.GroupBy(p => p.Gender).Select(g => new { Gender = g.Key, Count = g.Count() }).ToListAsync(ct);
        var byGender = byGenderRaw.Select(x => new NameCountDto(x.Gender, x.Count)).ToList();

        return new PatientReportDto(total, newRegistrations, byGender);
    }

    public async Task<AppointmentReportDto> GetAppointmentReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var query = db.Appointments.AsQueryable();
        if (from is not null) query = query.Where(a => a.Date >= from);
        if (to is not null) query = query.Where(a => a.Date <= to);

        var total = await query.CountAsync(ct);

        var byStatusRaw = await query.GroupBy(a => a.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync(ct);
        var byStatus = byStatusRaw.Select(x => new NameCountDto(x.Status.ToString(), x.Count)).ToList();

        var byDoctorRaw = await (
            from a in query
            join d in db.Doctors on a.DoctorId equals d.Id
            join u in db.Users on d.UserId equals u.Id
            group u.FullName by u.FullName into g
            select new { Name = g.Key, Count = g.Count() }
        ).ToListAsync(ct);
        var byDoctor = byDoctorRaw.Select(x => new NameCountDto(x.Name, x.Count)).ToList();

        return new AppointmentReportDto(total, byStatus, byDoctor);
    }

    public async Task<RevenueReportDto> GetRevenueReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var invoiceQuery = db.Invoices.AsQueryable();
        if (from is not null) invoiceQuery = invoiceQuery.Where(i => i.CreatedAtUtc >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to is not null) invoiceQuery = invoiceQuery.Where(i => i.CreatedAtUtc <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var totalBilled = await invoiceQuery.SumAsync(i => (decimal?)i.TotalAmount, ct) ?? 0;
        var totalCollected = await invoiceQuery.SumAsync(i => (decimal?)i.AmountPaid, ct) ?? 0;

        var invoiceIds = invoiceQuery.Select(i => i.Id);
        var byChargeTypeRaw = await db.InvoiceLineItems
            .Where(l => invoiceIds.Contains(l.InvoiceId))
            .GroupBy(l => l.ChargeType)
            .Select(g => new { ChargeType = g.Key, Amount = g.Sum(l => l.Amount) })
            .ToListAsync(ct);
        var byChargeType = byChargeTypeRaw.Select(x => new ChargeTypeAmountDto(x.ChargeType.ToString(), x.Amount)).ToList();

        return new RevenueReportDto(totalBilled, totalCollected, totalBilled - totalCollected, byChargeType);
    }

    public async Task<PharmacyReportDto> GetPharmacyReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var dispensedQuery = db.PrescriptionItems.Where(p => p.Status == PrescriptionItemStatus.Dispensed);
        if (from is not null) dispensedQuery = dispensedQuery.Where(p => p.DispensedAtUtc >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to is not null) dispensedQuery = dispensedQuery.Where(p => p.DispensedAtUtc <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var dispensedCount = await dispensedQuery.CountAsync(ct);
        var totalDispensedValue = await dispensedQuery
            .SumAsync(p => (decimal?)((p.DispensedQuantity ?? 0) * (p.UnitPriceAtDispense ?? 0)), ct) ?? 0;

        var lowStock = await db.Medicines
            .Where(m => m.StockQuantity <= m.ReorderThreshold)
            .Select(m => new MedicineDto(m.Id, m.Name, m.Unit, m.StockQuantity, m.UnitPrice, m.ExpiryDate, m.ReorderThreshold))
            .ToListAsync(ct);

        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var expiringSoon = await db.Medicines
            .Where(m => m.ExpiryDate <= cutoff)
            .Select(m => new MedicineDto(m.Id, m.Name, m.Unit, m.StockQuantity, m.UnitPrice, m.ExpiryDate, m.ReorderThreshold))
            .ToListAsync(ct);

        return new PharmacyReportDto(totalDispensedValue, dispensedCount, lowStock, expiringSoon);
    }

    public async Task<LaboratoryReportDto> GetLaboratoryReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var query = db.LabTestRequests.AsQueryable();
        if (from is not null) query = query.Where(l => l.RequestedAtUtc >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to is not null) query = query.Where(l => l.RequestedAtUtc <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var total = await query.CountAsync(ct);
        var completed = await query.CountAsync(l => l.Status == LabTestStatus.Completed, ct);

        var byStatusRaw = await query.GroupBy(l => l.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync(ct);
        var byStatus = byStatusRaw.Select(x => new NameCountDto(x.Status.ToString(), x.Count)).ToList();

        return new LaboratoryReportDto(total, completed, byStatus);
    }

    public async Task<StaffReportDto> GetStaffReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var attendanceQuery = db.AttendanceRecords.AsQueryable();
        if (from is not null) attendanceQuery = attendanceQuery.Where(a => a.Date >= from);
        if (to is not null) attendanceQuery = attendanceQuery.Where(a => a.Date <= to);

        var attendanceRaw = await attendanceQuery
            .GroupBy(a => a.EmployeeId)
            .Select(g => new
            {
                EmployeeId = g.Key,
                Present = g.Count(a => a.Status == AttendanceStatus.Present),
                Absent = g.Count(a => a.Status == AttendanceStatus.Absent),
                Late = g.Count(a => a.Status == AttendanceStatus.Late),
                HalfDay = g.Count(a => a.Status == AttendanceStatus.HalfDay)
            })
            .ToListAsync(ct);

        var employeeIds = attendanceRaw.Select(a => a.EmployeeId).ToList();
        var employeeNames = await db.Employees
            .Where(e => employeeIds.Contains(e.Id))
            .Join(db.Users, e => e.UserId, u => u.Id, (e, u) => new { e.Id, u.FullName })
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        var attendance = attendanceRaw
            .Select(a => new EmployeeAttendanceSummaryDto(
                a.EmployeeId, employeeNames.GetValueOrDefault(a.EmployeeId, "Unknown"), a.Present, a.Absent, a.Late, a.HalfDay))
            .ToList();

        var leaveQuery = db.LeaveRequests.AsQueryable();
        if (from is not null) leaveQuery = leaveQuery.Where(l => l.RequestedAtUtc >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to is not null) leaveQuery = leaveQuery.Where(l => l.RequestedAtUtc <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var pending = await leaveQuery.CountAsync(l => l.Status == LeaveStatus.Pending, ct);
        var approved = await leaveQuery.CountAsync(l => l.Status == LeaveStatus.Approved, ct);
        var rejected = await leaveQuery.CountAsync(l => l.Status == LeaveStatus.Rejected, ct);

        return new StaffReportDto(attendance, new LeaveSummaryDto(pending, approved, rejected));
    }
}
