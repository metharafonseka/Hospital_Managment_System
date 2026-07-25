using HMS.Application.Laboratory;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Laboratory;

public class LabTestService(ApplicationDbContext db) : ILabTestService
{
    public async Task<IReadOnlyList<LabTestRequestDto>> GetAllAsync(string? status, CancellationToken ct = default)
    {
        var query = db.LabTestRequests.Include(l => l.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LabTestStatus>(status, true, out var parsed))
            query = query.Where(l => l.Status == parsed);

        var records = await query.OrderBy(l => l.RequestedAtUtc).ToListAsync(ct);
        return records.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<LabTestRequestDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default)
    {
        var records = await db.LabTestRequests
            .Include(l => l.Patient)
            .Where(l => l.PatientId == patientId)
            .OrderByDescending(l => l.RequestedAtUtc)
            .ToListAsync(ct);
        return records.Select(Map).ToList();
    }

    public async Task<LabTestRequestDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var record = await db.LabTestRequests.Include(l => l.Patient).FirstOrDefaultAsync(l => l.Id == id, ct);
        return record is null ? null : Map(record);
    }

    public async Task<LabTestActionResult> CollectSampleAsync(int id, CancellationToken ct = default)
    {
        var record = await db.LabTestRequests.FindAsync([id], ct);
        if (record is null) return LabTestActionResult.NotFound;
        if (record.Status != LabTestStatus.Requested) return LabTestActionResult.InvalidState;

        record.Status = LabTestStatus.SampleCollected;
        record.SampleCollectedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return LabTestActionResult.Success;
    }

    public async Task<LabTestActionResult> EnterResultAsync(int id, EnterResultRequest request, CancellationToken ct = default)
    {
        var record = await db.LabTestRequests.FindAsync([id], ct);
        if (record is null) return LabTestActionResult.NotFound;
        if (record.Status != LabTestStatus.SampleCollected) return LabTestActionResult.InvalidState;

        record.Status = LabTestStatus.Completed;
        record.ResultText = request.ResultText;
        record.ResultEnteredAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return LabTestActionResult.Success;
    }

    public async Task<bool> SetPriceAsync(int id, SetLabTestPriceRequest request, CancellationToken ct = default)
    {
        var record = await db.LabTestRequests.FindAsync([id], ct);
        if (record is null) return false;

        record.Price = request.Price;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static LabTestRequestDto Map(Domain.Entities.LabTestRequest l) => new(
        l.Id, l.MedicalRecordId, l.PatientId, l.Patient!.FullName, l.TestName, l.Status.ToString(), l.Price,
        l.RequestedAtUtc, l.SampleCollectedAtUtc, l.ResultText, l.ResultEnteredAtUtc);
}
