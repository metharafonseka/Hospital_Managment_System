using System.Security.Claims;
using HMS.Application.Staff;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize(Roles = Roles.Administrator)]
public class EmployeesController(IStaffService service) : ControllerBase
{
    [HttpGet("employees")]
    public async Task<ActionResult<IReadOnlyList<EmployeeDto>>> GetAll(CancellationToken ct) =>
        Ok(await service.GetAllAsync(ct));

    [HttpGet("employees/{id:int}")]
    public async Task<ActionResult<EmployeeDto>> GetById(int id, CancellationToken ct)
    {
        var employee = await service.GetByIdAsync(id, ct);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpPost("employees")]
    public async Task<ActionResult<EmployeeDto>> Create(CreateEmployeeRequest request, CancellationToken ct)
    {
        var (result, employee, errors) = await service.CreateAsync(request, ct);
        return result switch
        {
            CreateEmployeeResult.Success => CreatedAtAction(nameof(GetById), new { id = employee!.Id }, employee),
            CreateEmployeeResult.InvalidRole => BadRequest(new { message = "Invalid role for a staff record (doctors are managed separately)." }),
            CreateEmployeeResult.InvalidDepartment => BadRequest(new { message = "Invalid department." }),
            CreateEmployeeResult.EmailInUse => BadRequest(new { message = "Email already in use.", errors }),
            _ => BadRequest()
        };
    }

    [HttpPut("employees/{id:int}")]
    public async Task<ActionResult<EmployeeDto>> Update(int id, UpdateEmployeeRequest request, CancellationToken ct)
    {
        var (found, departmentValid, employee) = await service.UpdateAsync(id, request, ct);
        if (!found) return NotFound();
        if (!departmentValid) return BadRequest(new { message = "Invalid department." });
        return Ok(employee);
    }

    [HttpGet("employees/{id:int}/attendance")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetAttendance(
        int id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetAttendanceAsync(id, from, to, ct));

    [HttpPut("employees/{id:int}/attendance")]
    public async Task<ActionResult<AttendanceRecordDto>> MarkAttendance(int id, MarkAttendanceRequest request, CancellationToken ct)
    {
        var record = await service.MarkAttendanceAsync(id, request, ct);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpGet("employees/{id:int}/leave-requests")]
    public async Task<ActionResult<IReadOnlyList<LeaveRequestDto>>> GetLeaveForEmployee(int id, CancellationToken ct) =>
        Ok(await service.GetLeaveRequestsAsync(id, null, ct));

    [HttpPost("employees/{id:int}/leave-requests")]
    public async Task<ActionResult<LeaveRequestDto>> CreateLeaveRequest(int id, CreateLeaveRequestRequest request, CancellationToken ct)
    {
        var leaveRequest = await service.CreateLeaveRequestAsync(id, request, ct);
        return leaveRequest is null ? NotFound() : Ok(leaveRequest);
    }

    [HttpGet("leave-requests")]
    public async Task<ActionResult<IReadOnlyList<LeaveRequestDto>>> GetAllLeaveRequests([FromQuery] string? status, CancellationToken ct) =>
        Ok(await service.GetLeaveRequestsAsync(null, status, ct));

    [HttpPut("leave-requests/{id:int}/decide")]
    public async Task<ActionResult<LeaveRequestDto>> Decide(int id, DecideLeaveRequestRequest request, CancellationToken ct)
    {
        var decidedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (result, leaveRequest) = await service.DecideLeaveRequestAsync(id, request, decidedByUserId, ct);
        return result switch
        {
            LeaveActionResult.Success => Ok(leaveRequest),
            LeaveActionResult.NotFound => NotFound(),
            LeaveActionResult.InvalidState => BadRequest(new { message = "This leave request has already been decided." }),
            _ => BadRequest()
        };
    }
}
