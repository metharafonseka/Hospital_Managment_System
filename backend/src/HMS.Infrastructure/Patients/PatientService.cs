using HMS.Application.Patients;
using HMS.Domain.Entities;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Patients;

public class PatientService(ApplicationDbContext db) : IPatientService
{
    public async Task<IReadOnlyList<PatientDto>> SearchAsync(string? search, CancellationToken ct = default)
    {
        var query = db.Patients.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.FullName.Contains(search) ||
                p.PatientCode.Contains(search) ||
                (p.ContactNumber != null && p.ContactNumber.Contains(search)));
        }

        return await query.OrderBy(p => p.FullName).Select(p => Map(p)).ToListAsync(ct);
    }

    public async Task<PatientDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var patient = await db.Patients.FindAsync([id], ct);
        return patient is null ? null : Map(patient);
    }

    public async Task<PatientDto> CreateAsync(CreatePatientRequest request, CancellationToken ct = default)
    {
        var patient = new Patient
        {
            PatientCode = "PENDING",
            FullName = request.FullName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            ContactNumber = request.ContactNumber,
            Address = request.Address,
            EmergencyContact = request.EmergencyContact
        };
        db.Patients.Add(patient);
        await db.SaveChangesAsync(ct);

        patient.PatientCode = $"P-{patient.Id:D6}";
        await db.SaveChangesAsync(ct);

        return Map(patient);
    }

    public async Task<PatientDto?> UpdateAsync(int id, UpdatePatientRequest request, CancellationToken ct = default)
    {
        var patient = await db.Patients.FindAsync([id], ct);
        if (patient is null) return null;

        patient.FullName = request.FullName;
        patient.DateOfBirth = request.DateOfBirth;
        patient.Gender = request.Gender;
        patient.ContactNumber = request.ContactNumber;
        patient.Address = request.Address;
        patient.EmergencyContact = request.EmergencyContact;
        await db.SaveChangesAsync(ct);

        return Map(patient);
    }

    private static PatientDto Map(Patient p) => new(
        p.Id, p.PatientCode, p.FullName, p.DateOfBirth, p.Gender, p.ContactNumber, p.Address, p.EmergencyContact);
}
