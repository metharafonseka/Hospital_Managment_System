using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Appointments;

public record AppointmentDto(
    int Id,
    int PatientId,
    string PatientName,
    int DoctorId,
    string DoctorName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string Status,
    string? Notes);

public record CreateAppointmentRequest(
    [Required] int PatientId,
    [Required] int DoctorId,
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime,
    [StringLength(500)] string? Notes);

public record RescheduleAppointmentRequest(
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime);

public enum CreateAppointmentResult { Success, PatientNotFound, DoctorNotFound, OutsideSchedule, SlotTaken }

public enum RescheduleAppointmentResult { Success, NotFound, NotReschedulable, OutsideSchedule, SlotTaken }
