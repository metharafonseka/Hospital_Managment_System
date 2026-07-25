using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Doctors;

public record DoctorDto(
    int Id,
    string UserId,
    string FullName,
    string Email,
    int DepartmentId,
    string DepartmentName,
    string Specialization,
    string LicenseNumber,
    decimal ConsultationFee);

public record CreateDoctorRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] int DepartmentId,
    [Required, StringLength(200)] string Specialization,
    [Required, StringLength(100)] string LicenseNumber,
    [Range(0, 1000000)] decimal ConsultationFee);

public record UpdateDoctorRequest(
    [Required] int DepartmentId,
    [Required, StringLength(200)] string Specialization,
    [Required, StringLength(100)] string LicenseNumber,
    [Range(0, 1000000)] decimal ConsultationFee);

public enum CreateDoctorResult { Success, EmailInUse, InvalidDepartment }

public record DoctorScheduleDto(int Id, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, int SlotDurationMinutes);

public record CreateDoctorScheduleRequest(
    [Required] DayOfWeek DayOfWeek,
    [Required] TimeOnly StartTime,
    [Required] TimeOnly EndTime,
    [Range(5, 240)] int SlotDurationMinutes);
