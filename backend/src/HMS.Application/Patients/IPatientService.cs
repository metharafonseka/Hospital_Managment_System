namespace HMS.Application.Patients;

public interface IPatientService
{
    Task<IReadOnlyList<PatientDto>> SearchAsync(string? search, CancellationToken ct = default);
    Task<PatientDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PatientDto> CreateAsync(CreatePatientRequest request, CancellationToken ct = default);
    Task<PatientDto?> UpdateAsync(int id, UpdatePatientRequest request, CancellationToken ct = default);
}
