using HMS.Application.Doctors;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/doctors")]
[Authorize]
public class DoctorsController(IDoctorService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DoctorDto>>> GetAll(CancellationToken ct) =>
        Ok(await service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DoctorDto>> GetById(int id, CancellationToken ct)
    {
        var doctor = await service.GetByIdAsync(id, ct);
        return doctor is null ? NotFound() : Ok(doctor);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpPost]
    public async Task<ActionResult<DoctorDto>> Create(CreateDoctorRequest request, CancellationToken ct)
    {
        var (result, doctor, errors) = await service.CreateAsync(request, ct);
        return result switch
        {
            CreateDoctorResult.Success => CreatedAtAction(nameof(GetById), new { id = doctor!.Id }, doctor),
            CreateDoctorResult.InvalidDepartment => BadRequest(new { message = "Invalid department." }),
            CreateDoctorResult.EmailInUse => BadRequest(new { message = "Email already in use.", errors }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<DoctorDto>> Update(int id, UpdateDoctorRequest request, CancellationToken ct)
    {
        var (found, departmentValid, doctor) = await service.UpdateAsync(id, request, ct);
        if (!found) return NotFound();
        if (!departmentValid) return BadRequest(new { message = "Invalid department." });
        return Ok(doctor);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpGet("{id:int}/schedules")]
    public async Task<ActionResult<IReadOnlyList<DoctorScheduleDto>>> GetSchedules(int id, CancellationToken ct) =>
        Ok(await service.GetSchedulesAsync(id, ct));

    [Authorize(Roles = Roles.Administrator)]
    [HttpPost("{id:int}/schedules")]
    public async Task<ActionResult<DoctorScheduleDto>> AddSchedule(int id, CreateDoctorScheduleRequest request, CancellationToken ct)
    {
        var schedule = await service.AddScheduleAsync(id, request, ct);
        return schedule is null ? NotFound() : CreatedAtAction(nameof(GetSchedules), new { id }, schedule);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpDelete("{id:int}/schedules/{scheduleId:int}")]
    public async Task<IActionResult> RemoveSchedule(int id, int scheduleId, CancellationToken ct)
    {
        var removed = await service.RemoveScheduleAsync(id, scheduleId, ct);
        return removed ? NoContent() : NotFound();
    }
}
