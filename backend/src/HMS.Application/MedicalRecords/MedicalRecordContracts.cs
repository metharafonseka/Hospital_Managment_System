using System.ComponentModel.DataAnnotations;

namespace HMS.Application.MedicalRecords;

public record PrescriptionItemDto(
    int Id, string MedicineName, string Dosage, string Frequency, int? DurationDays, string? Instructions, string Status);

public record LabTestOrderDto(int Id, string TestName, string Status);

public record MedicalRecordDto(
    int Id,
    int AppointmentId,
    int PatientId,
    string PatientName,
    int DoctorId,
    string DoctorName,
    DateOnly VisitDate,
    string Diagnosis,
    string? Notes,
    DateTime CreatedAtUtc,
    IReadOnlyList<PrescriptionItemDto> Prescriptions,
    IReadOnlyList<LabTestOrderDto> LabTests);

public record PrescriptionItemRequest(
    [Required, StringLength(200)] string MedicineName,
    [Required, StringLength(100)] string Dosage,
    [Required, StringLength(100)] string Frequency,
    int? DurationDays,
    [StringLength(500)] string? Instructions);

public record LabTestOrderRequest([Required, StringLength(200)] string TestName);

public record CreateMedicalRecordRequest(
    [Required] int AppointmentId,
    [Required, StringLength(1000)] string Diagnosis,
    [StringLength(2000)] string? Notes,
    List<PrescriptionItemRequest> Prescriptions,
    List<LabTestOrderRequest> LabTests);

public enum CreateMedicalRecordResult { Success, AppointmentNotFound, AppointmentNotCompletable, AlreadyRecorded }
