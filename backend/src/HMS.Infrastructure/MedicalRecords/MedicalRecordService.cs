using HMS.Application.MedicalRecords;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.MedicalRecords;

public class MedicalRecordService(ApplicationDbContext db) : IMedicalRecordService
{
    public async Task<MedicalRecordDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var record = await LoadQuery().FirstOrDefaultAsync(m => m.Id == id, ct);
        return record is null ? null : (await MapManyAsync([record], ct))[0];
    }

    public async Task<MedicalRecordDto?> GetByAppointmentIdAsync(int appointmentId, CancellationToken ct = default)
    {
        var record = await LoadQuery().FirstOrDefaultAsync(m => m.AppointmentId == appointmentId, ct);
        return record is null ? null : (await MapManyAsync([record], ct))[0];
    }

    public async Task<IReadOnlyList<MedicalRecordDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default)
    {
        var records = await LoadQuery()
            .Where(m => m.PatientId == patientId)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ToListAsync(ct);
        return await MapManyAsync(records, ct);
    }

    public async Task<int?> GetAppointmentDoctorIdAsync(int appointmentId, CancellationToken ct = default) =>
        await db.Appointments.Where(a => a.Id == appointmentId).Select(a => (int?)a.DoctorId).FirstOrDefaultAsync(ct);

    public async Task<(CreateMedicalRecordResult, MedicalRecordDto?)> CreateAsync(
        CreateMedicalRecordRequest request, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FindAsync([request.AppointmentId], ct);
        if (appointment is null) return (CreateMedicalRecordResult.AppointmentNotFound, null);
        if (appointment.Status != AppointmentStatus.Scheduled) return (CreateMedicalRecordResult.AppointmentNotCompletable, null);

        if (await db.MedicalRecords.AnyAsync(m => m.AppointmentId == request.AppointmentId, ct))
            return (CreateMedicalRecordResult.AlreadyRecorded, null);

        var record = new MedicalRecord
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            DoctorId = appointment.DoctorId,
            Diagnosis = request.Diagnosis,
            Notes = request.Notes,
            PrescriptionItems = request.Prescriptions.Select(p => new PrescriptionItem
            {
                MedicineName = p.MedicineName,
                Dosage = p.Dosage,
                Frequency = p.Frequency,
                DurationDays = p.DurationDays,
                Instructions = p.Instructions
            }).ToList()
        };
        db.MedicalRecords.Add(record);
        appointment.Status = AppointmentStatus.Completed;

        await db.SaveChangesAsync(ct);

        foreach (var labTest in request.LabTests)
        {
            db.LabTestRequests.Add(new LabTestRequest
            {
                MedicalRecordId = record.Id,
                PatientId = record.PatientId,
                TestName = labTest.TestName
            });
        }
        if (request.LabTests.Count > 0) await db.SaveChangesAsync(ct);

        var dto = await GetByIdAsync(record.Id, ct);
        return (CreateMedicalRecordResult.Success, dto);
    }

    private IQueryable<MedicalRecord> LoadQuery() =>
        db.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Doctor)
            .Include(m => m.Appointment)
            .Include(m => m.PrescriptionItems);

    private async Task<IReadOnlyList<MedicalRecordDto>> MapManyAsync(List<MedicalRecord> records, CancellationToken ct)
    {
        var doctorUserIds = records.Select(r => r.Doctor!.UserId).Distinct().ToList();
        var doctorNames = await db.Users
            .Where(u => doctorUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName, ct);

        var recordIds = records.Select(r => r.Id).ToList();
        var labTestsByRecord = (await db.LabTestRequests
                .Where(l => recordIds.Contains(l.MedicalRecordId))
                .ToListAsync(ct))
            .GroupBy(l => l.MedicalRecordId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return records.Select(record => new MedicalRecordDto(
            record.Id,
            record.AppointmentId,
            record.PatientId,
            record.Patient!.FullName,
            record.DoctorId,
            doctorNames.GetValueOrDefault(record.Doctor!.UserId, "Unknown"),
            record.Appointment!.Date,
            record.Diagnosis,
            record.Notes,
            record.CreatedAtUtc,
            record.PrescriptionItems
                .Select(p => new PrescriptionItemDto(
                    p.Id, p.MedicineName, p.Dosage, p.Frequency, p.DurationDays, p.Instructions, p.Status.ToString()))
                .ToList(),
            labTestsByRecord.GetValueOrDefault(record.Id, [])
                .Select(l => new LabTestOrderDto(l.Id, l.TestName, l.Status.ToString()))
                .ToList())
        ).ToList();
    }
}
