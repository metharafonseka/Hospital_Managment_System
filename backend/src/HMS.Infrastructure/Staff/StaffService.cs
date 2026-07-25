using HMS.Application.Staff;
using HMS.Domain.Constants;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using HMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Staff;

public class StaffService(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : IStaffService
{
    private static readonly string[] EligibleRoles =
    [
        Roles.Administrator, Roles.Nurse, Roles.Receptionist, Roles.LaboratoryStaff, Roles.Pharmacist, Roles.Accountant
    ];

    public async Task<IReadOnlyList<EmployeeDto>> GetAllAsync(CancellationToken ct = default) =>
        await MapManyAsync(await LoadQuery().ToListAsync(ct), ct);

    public async Task<EmployeeDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var employee = await LoadQuery().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (employee is null) return null;
        return (await MapManyAsync([employee], ct))[0];
    }

    private IQueryable<Employee> LoadQuery() => db.Employees.Include(e => e.Department);

    private async Task<IReadOnlyList<EmployeeDto>> MapManyAsync(List<Employee> employees, CancellationToken ct)
    {
        var userIds = employees.Select(e => e.UserId).ToList();
        var users = await db.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct);

        var roleByUserId = new Dictionary<string, string>();
        foreach (var employee in employees)
        {
            if (roleByUserId.ContainsKey(employee.UserId)) continue;
            var user = await userManager.FindByIdAsync(employee.UserId);
            var role = user is null ? "Unknown" : (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? "Unknown";
            roleByUserId[employee.UserId] = role;
        }

        return employees.Select(e => new EmployeeDto(
            e.Id, e.UserId, users[e.UserId].FullName, users[e.UserId].Email!, roleByUserId[e.UserId],
            e.DepartmentId, e.Department!.Name, e.JobTitle, e.HireDate)).ToList();
    }

    public async Task<(CreateEmployeeResult, EmployeeDto?, IEnumerable<string>?)> CreateAsync(
        CreateEmployeeRequest request, CancellationToken ct = default)
    {
        if (!EligibleRoles.Contains(request.Role))
            return (CreateEmployeeResult.InvalidRole, null, null);

        var department = await db.Departments.FindAsync([request.DepartmentId], ct);
        if (department is null)
            return (CreateEmployeeResult.InvalidDepartment, null, null);

        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return (CreateEmployeeResult.EmailInUse, null, null);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };
        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return (CreateEmployeeResult.EmailInUse, null, createResult.Errors.Select(e => e.Description));

        await userManager.AddToRoleAsync(user, request.Role);

        var employee = new Employee
        {
            UserId = user.Id,
            DepartmentId = request.DepartmentId,
            JobTitle = request.JobTitle,
            HireDate = request.HireDate
        };
        db.Employees.Add(employee);
        await db.SaveChangesAsync(ct);

        var dto = new EmployeeDto(
            employee.Id, user.Id, user.FullName, user.Email!, request.Role,
            department.Id, department.Name, employee.JobTitle, employee.HireDate);
        return (CreateEmployeeResult.Success, dto, null);
    }

    public async Task<(bool Found, bool DepartmentValid, EmployeeDto? Employee)> UpdateAsync(
        int id, UpdateEmployeeRequest request, CancellationToken ct = default)
    {
        var employee = await db.Employees.FindAsync([id], ct);
        if (employee is null) return (false, true, null);

        var departmentExists = await db.Departments.AnyAsync(d => d.Id == request.DepartmentId, ct);
        if (!departmentExists) return (true, false, null);

        employee.DepartmentId = request.DepartmentId;
        employee.JobTitle = request.JobTitle;
        await db.SaveChangesAsync(ct);

        var updated = await GetByIdAsync(id, ct);
        return (true, true, updated);
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetAttendanceAsync(
        int employeeId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var query = db.AttendanceRecords.Where(a => a.EmployeeId == employeeId);
        if (from is not null) query = query.Where(a => a.Date >= from);
        if (to is not null) query = query.Where(a => a.Date <= to);

        return await query.OrderByDescending(a => a.Date)
            .Select(a => new AttendanceRecordDto(a.Id, a.EmployeeId, a.Date, a.Status.ToString(), a.CheckInTime, a.CheckOutTime, a.Notes))
            .ToListAsync(ct);
    }

    public async Task<AttendanceRecordDto?> MarkAttendanceAsync(
        int employeeId, MarkAttendanceRequest request, CancellationToken ct = default)
    {
        var employeeExists = await db.Employees.AnyAsync(e => e.Id == employeeId, ct);
        if (!employeeExists) return null;

        var record = await db.AttendanceRecords.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == request.Date, ct);
        if (record is null)
        {
            record = new AttendanceRecord { EmployeeId = employeeId, Date = request.Date };
            db.AttendanceRecords.Add(record);
        }

        record.Status = request.Status;
        record.CheckInTime = request.CheckInTime;
        record.CheckOutTime = request.CheckOutTime;
        record.Notes = request.Notes;
        await db.SaveChangesAsync(ct);

        return new AttendanceRecordDto(record.Id, record.EmployeeId, record.Date, record.Status.ToString(), record.CheckInTime, record.CheckOutTime, record.Notes);
    }

    public async Task<IReadOnlyList<LeaveRequestDto>> GetLeaveRequestsAsync(
        int? employeeId, string? status, CancellationToken ct = default)
    {
        var query = db.LeaveRequests.Include(l => l.Employee).AsQueryable();
        if (employeeId is not null) query = query.Where(l => l.EmployeeId == employeeId);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LeaveStatus>(status, true, out var parsed))
            query = query.Where(l => l.Status == parsed);

        var records = await query.OrderByDescending(l => l.RequestedAtUtc).ToListAsync(ct);
        return await MapLeaveManyAsync(records, ct);
    }

    private async Task<IReadOnlyList<LeaveRequestDto>> MapLeaveManyAsync(List<LeaveRequest> records, CancellationToken ct)
    {
        var employeeIds = records.Select(r => r.EmployeeId).Distinct().ToList();
        var employees = await LoadQuery().Where(e => employeeIds.Contains(e.Id)).ToListAsync(ct);
        var employeeDtos = (await MapManyAsync(employees, ct)).ToDictionary(e => e.Id);

        return records.Select(r => new LeaveRequestDto(
            r.Id, r.EmployeeId, employeeDtos.GetValueOrDefault(r.EmployeeId)?.FullName ?? "Unknown",
            r.StartDate, r.EndDate, r.Reason, r.Status.ToString(), r.RequestedAtUtc, r.DecidedAtUtc)).ToList();
    }

    public async Task<LeaveRequestDto?> CreateLeaveRequestAsync(
        int employeeId, CreateLeaveRequestRequest request, CancellationToken ct = default)
    {
        var employee = await GetByIdAsync(employeeId, ct);
        if (employee is null) return null;

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = employeeId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason
        };
        db.LeaveRequests.Add(leaveRequest);
        await db.SaveChangesAsync(ct);

        return new LeaveRequestDto(
            leaveRequest.Id, employeeId, employee.FullName, leaveRequest.StartDate, leaveRequest.EndDate,
            leaveRequest.Reason, leaveRequest.Status.ToString(), leaveRequest.RequestedAtUtc, null);
    }

    public async Task<(LeaveActionResult, LeaveRequestDto?)> DecideLeaveRequestAsync(
        int leaveRequestId, DecideLeaveRequestRequest request, string decidedByUserId, CancellationToken ct = default)
    {
        var leaveRequest = await db.LeaveRequests.FindAsync([leaveRequestId], ct);
        if (leaveRequest is null) return (LeaveActionResult.NotFound, null);
        if (leaveRequest.Status != LeaveStatus.Pending) return (LeaveActionResult.InvalidState, null);

        leaveRequest.Status = request.Approved ? LeaveStatus.Approved : LeaveStatus.Rejected;
        leaveRequest.DecidedAtUtc = DateTime.UtcNow;
        leaveRequest.DecidedByUserId = decidedByUserId;
        await db.SaveChangesAsync(ct);

        var results = await MapLeaveManyAsync([leaveRequest], ct);
        return (LeaveActionResult.Success, results[0]);
    }
}
