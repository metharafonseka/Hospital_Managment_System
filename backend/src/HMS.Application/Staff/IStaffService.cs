namespace HMS.Application.Staff;

public interface IStaffService
{
    Task<IReadOnlyList<EmployeeDto>> GetAllAsync(CancellationToken ct = default);
    Task<EmployeeDto?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<(CreateEmployeeResult Result, EmployeeDto? Employee, IEnumerable<string>? Errors)> CreateAsync(
        CreateEmployeeRequest request, CancellationToken ct = default);

    Task<(bool Found, bool DepartmentValid, EmployeeDto? Employee)> UpdateAsync(
        int id, UpdateEmployeeRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<AttendanceRecordDto>> GetAttendanceAsync(
        int employeeId, DateOnly? from, DateOnly? to, CancellationToken ct = default);

    Task<AttendanceRecordDto?> MarkAttendanceAsync(int employeeId, MarkAttendanceRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<LeaveRequestDto>> GetLeaveRequestsAsync(int? employeeId, string? status, CancellationToken ct = default);

    Task<LeaveRequestDto?> CreateLeaveRequestAsync(
        int employeeId, CreateLeaveRequestRequest request, CancellationToken ct = default);

    Task<(LeaveActionResult Result, LeaveRequestDto? LeaveRequest)> DecideLeaveRequestAsync(
        int leaveRequestId, DecideLeaveRequestRequest request, string decidedByUserId, CancellationToken ct = default);
}
