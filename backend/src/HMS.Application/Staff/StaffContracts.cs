using System.ComponentModel.DataAnnotations;
using HMS.Domain.Enums;

namespace HMS.Application.Staff;

public record EmployeeDto(
    int Id,
    string UserId,
    string FullName,
    string Email,
    string Role,
    int DepartmentId,
    string DepartmentName,
    string JobTitle,
    DateOnly HireDate);

public record CreateEmployeeRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string Role,
    [Required] int DepartmentId,
    [Required, StringLength(200)] string JobTitle,
    [Required] DateOnly HireDate);

public record UpdateEmployeeRequest([Required] int DepartmentId, [Required, StringLength(200)] string JobTitle);

public enum CreateEmployeeResult { Success, EmailInUse, InvalidDepartment, InvalidRole }

public record AttendanceRecordDto(
    int Id, int EmployeeId, DateOnly Date, string Status, TimeOnly? CheckInTime, TimeOnly? CheckOutTime, string? Notes);

public record MarkAttendanceRequest(
    [Required] DateOnly Date,
    [Required] AttendanceStatus Status,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    [StringLength(500)] string? Notes);

public record LeaveRequestDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason,
    string Status,
    DateTime RequestedAtUtc,
    DateTime? DecidedAtUtc);

public record CreateLeaveRequestRequest(
    [Required] DateOnly StartDate, [Required] DateOnly EndDate, [Required, StringLength(500)] string Reason);

public record DecideLeaveRequestRequest([Required] bool Approved);

public enum LeaveActionResult { Success, NotFound, InvalidState }
