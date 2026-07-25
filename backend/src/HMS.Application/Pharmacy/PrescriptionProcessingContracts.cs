using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Pharmacy;

public record PendingPrescriptionDto(
    int Id,
    int MedicalRecordId,
    int PatientId,
    string PatientName,
    string MedicineName,
    string Dosage,
    string Frequency,
    int? DurationDays,
    string? Instructions,
    string Status,
    DateTime PrescribedAtUtc);

public record DispenseRequest([Required] int MedicineId, [Range(1, int.MaxValue)] int Quantity);

public enum DispenseResult { Success, PrescriptionNotFound, InvalidState, MedicineNotFound, InsufficientStock }
