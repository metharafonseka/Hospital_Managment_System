using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Patients;

public record PatientDto(
    int Id,
    string PatientCode,
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string? ContactNumber,
    string? Address,
    string? EmergencyContact);

public record CreatePatientRequest(
    [Required, StringLength(200)] string FullName,
    [Required] DateOnly DateOfBirth,
    [Required, StringLength(20)] string Gender,
    [StringLength(30)] string? ContactNumber,
    [StringLength(300)] string? Address,
    [StringLength(200)] string? EmergencyContact);

public record UpdatePatientRequest(
    [Required, StringLength(200)] string FullName,
    [Required] DateOnly DateOfBirth,
    [Required, StringLength(20)] string Gender,
    [StringLength(30)] string? ContactNumber,
    [StringLength(300)] string? Address,
    [StringLength(200)] string? EmergencyContact);
