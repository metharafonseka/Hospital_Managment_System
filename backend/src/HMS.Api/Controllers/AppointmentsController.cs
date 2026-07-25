using System.Security.Claims;
using HMS.Application.Appointments;
using HMS.Application.Doctors;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/appointments")]
[Authorize]
public class AppointmentsController(IAppointmentService service, IDoctorService doctorService) : ControllerBase
{
    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist},{Roles.Nurse}")]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> GetAll(
        [FromQuery] int? doctorId, [FromQuery] int? patientId, [FromQuery] DateOnly? date, CancellationToken ct) =>
        Ok(await service.GetAllAsync(doctorId, patientId, date, ct));

    [Authorize(Roles = Roles.Doctor)]
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> GetMine([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var doctor = await doctorService.GetByUserIdAsync(CurrentUserId, ct);
        if (doctor is null) return Ok(Array.Empty<AppointmentDto>());

        return Ok(await service.GetAllAsync(doctor.Id, null, date, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> GetById(int id, CancellationToken ct)
    {
        var appointment = await service.GetByIdAsync(id, ct);
        return appointment is null ? NotFound() : Ok(appointment);
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpGet("available-slots")]
    public async Task<ActionResult<IReadOnlyList<TimeOnly>>> GetAvailableSlots(
        [FromQuery] int doctorId, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(await service.GetAvailableSlotsAsync(doctorId, date, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create(CreateAppointmentRequest request, CancellationToken ct)
    {
        var (result, appointment) = await service.CreateAsync(request, ct);
        return result switch
        {
            CreateAppointmentResult.Success => CreatedAtAction(nameof(GetById), new { id = appointment!.Id }, appointment),
            CreateAppointmentResult.PatientNotFound => BadRequest(new { message = "Patient not found." }),
            CreateAppointmentResult.DoctorNotFound => BadRequest(new { message = "Doctor not found." }),
            CreateAppointmentResult.OutsideSchedule => BadRequest(new { message = "Requested time is outside the doctor's schedule." }),
            CreateAppointmentResult.SlotTaken => Conflict(new { message = "That slot has just been booked." }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpPut("{id:int}/reschedule")]
    public async Task<ActionResult<AppointmentDto>> Reschedule(int id, RescheduleAppointmentRequest request, CancellationToken ct)
    {
        var (result, appointment) = await service.RescheduleAsync(id, request, ct);
        return result switch
        {
            RescheduleAppointmentResult.Success => Ok(appointment),
            RescheduleAppointmentResult.NotFound => NotFound(),
            RescheduleAppointmentResult.NotReschedulable => BadRequest(new { message = "Only scheduled appointments can be rescheduled." }),
            RescheduleAppointmentResult.OutsideSchedule => BadRequest(new { message = "Requested time is outside the doctor's schedule." }),
            RescheduleAppointmentResult.SlotTaken => Conflict(new { message = "That slot has just been booked." }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        var cancelled = await service.CancelAsync(id, ct);
        return cancelled ? NoContent() : NotFound();
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor}")]
    [HttpPut("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, CancellationToken ct)
    {
        if (User.IsInRole(Roles.Doctor) && !User.IsInRole(Roles.Administrator))
        {
            var doctor = await doctorService.GetByUserIdAsync(CurrentUserId, ct);
            var appointment = await service.GetByIdAsync(id, ct);
            if (doctor is null || appointment is null || appointment.DoctorId != doctor.Id) return Forbid();
        }

        var completed = await service.CompleteAsync(id, ct);
        return completed ? NoContent() : NotFound();
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
}
