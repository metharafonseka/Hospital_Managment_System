namespace HMS.Application.MedicalRecords;

public interface IMedicalRecordService
{
    Task<MedicalRecordDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<MedicalRecordDto?> GetByAppointmentIdAsync(int appointmentId, CancellationToken ct = default);
    Task<IReadOnlyList<MedicalRecordDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default);

    Task<(CreateMedicalRecordResult Result, MedicalRecordDto? Record)> CreateAsync(
        CreateMedicalRecordRequest request, CancellationToken ct = default);

    /// <summary>Doctor id (not user id) the given appointment belongs to — used by the controller for ownership checks.</summary>
    Task<int?> GetAppointmentDoctorIdAsync(int appointmentId, CancellationToken ct = default);
}
