using HMS.Application.Doctors;
using HMS.Domain.Constants;
using HMS.Domain.Entities;
using HMS.Infrastructure.Data;
using HMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Doctors;

public class DoctorService(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : IDoctorService
{
    public async Task<IReadOnlyList<DoctorDto>> GetAllAsync(CancellationToken ct = default) =>
        await MapQuery(db.Doctors).ToListAsync(ct);

    public async Task<DoctorDto?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await MapQuery(db.Doctors.Where(d => d.Id == id)).FirstOrDefaultAsync(ct);

    public async Task<DoctorDto?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        await MapQuery(db.Doctors.Where(d => d.UserId == userId)).FirstOrDefaultAsync(ct);

    private IQueryable<DoctorDto> MapQuery(IQueryable<Doctor> source) =>
        from d in source
        join u in db.Users on d.UserId equals u.Id
        join dep in db.Departments on d.DepartmentId equals dep.Id
        select new DoctorDto(
            d.Id, d.UserId, u.FullName, u.Email!, dep.Id, dep.Name, d.Specialization, d.LicenseNumber, d.ConsultationFee);

    public async Task<(CreateDoctorResult, DoctorDto?, IEnumerable<string>?)> CreateAsync(
        CreateDoctorRequest request, CancellationToken ct = default)
    {
        var department = await db.Departments.FindAsync([request.DepartmentId], ct);
        if (department is null)
            return (CreateDoctorResult.InvalidDepartment, null, null);

        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return (CreateDoctorResult.EmailInUse, null, null);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };
        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return (CreateDoctorResult.EmailInUse, null, createResult.Errors.Select(e => e.Description));

        await userManager.AddToRoleAsync(user, Roles.Doctor);

        var doctor = new Doctor
        {
            UserId = user.Id,
            DepartmentId = request.DepartmentId,
            Specialization = request.Specialization,
            LicenseNumber = request.LicenseNumber,
            ConsultationFee = request.ConsultationFee
        };
        db.Doctors.Add(doctor);
        await db.SaveChangesAsync(ct);

        var dto = new DoctorDto(doctor.Id, user.Id, user.FullName, user.Email!, department.Id, department.Name,
            doctor.Specialization, doctor.LicenseNumber, doctor.ConsultationFee);
        return (CreateDoctorResult.Success, dto, null);
    }

    public async Task<(bool Found, bool DepartmentValid, DoctorDto? Doctor)> UpdateAsync(
        int id, UpdateDoctorRequest request, CancellationToken ct = default)
    {
        var doctor = await db.Doctors.FindAsync([id], ct);
        if (doctor is null) return (false, true, null);

        var departmentExists = await db.Departments.AnyAsync(dep => dep.Id == request.DepartmentId, ct);
        if (!departmentExists) return (true, false, null);

        doctor.DepartmentId = request.DepartmentId;
        doctor.Specialization = request.Specialization;
        doctor.LicenseNumber = request.LicenseNumber;
        doctor.ConsultationFee = request.ConsultationFee;
        await db.SaveChangesAsync(ct);

        var updated = await GetByIdAsync(id, ct);
        return (true, true, updated);
    }

    public async Task<IReadOnlyList<DoctorScheduleDto>> GetSchedulesAsync(int doctorId, CancellationToken ct = default) =>
        await db.DoctorSchedules
            .Where(s => s.DoctorId == doctorId)
            .Select(s => new DoctorScheduleDto(s.Id, s.DayOfWeek, s.StartTime, s.EndTime, s.SlotDurationMinutes))
            .ToListAsync(ct);

    public async Task<DoctorScheduleDto?> AddScheduleAsync(
        int doctorId, CreateDoctorScheduleRequest request, CancellationToken ct = default)
    {
        var doctorExists = await db.Doctors.AnyAsync(d => d.Id == doctorId, ct);
        if (!doctorExists) return null;

        var schedule = new DoctorSchedule
        {
            DoctorId = doctorId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes
        };
        db.DoctorSchedules.Add(schedule);
        await db.SaveChangesAsync(ct);

        return new DoctorScheduleDto(schedule.Id, schedule.DayOfWeek, schedule.StartTime, schedule.EndTime, schedule.SlotDurationMinutes);
    }

    public async Task<bool> RemoveScheduleAsync(int doctorId, int scheduleId, CancellationToken ct = default)
    {
        var schedule = await db.DoctorSchedules.FirstOrDefaultAsync(s => s.Id == scheduleId && s.DoctorId == doctorId, ct);
        if (schedule is null) return false;

        db.DoctorSchedules.Remove(schedule);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
