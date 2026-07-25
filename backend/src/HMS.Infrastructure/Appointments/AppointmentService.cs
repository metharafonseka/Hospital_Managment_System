using HMS.Application.Appointments;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Appointments;

public class AppointmentService(ApplicationDbContext db) : IAppointmentService
{
    public async Task<IReadOnlyList<AppointmentDto>> GetAllAsync(
        int? doctorId, int? patientId, DateOnly? date, CancellationToken ct = default)
    {
        var source = db.Appointments.AsQueryable();
        if (doctorId is not null) source = source.Where(a => a.DoctorId == doctorId);
        if (patientId is not null) source = source.Where(a => a.PatientId == patientId);
        if (date is not null) source = source.Where(a => a.Date == date);

        source = source.OrderBy(a => a.Date).ThenBy(a => a.StartTime);
        return await MapQuery(source).ToListAsync(ct);
    }

    public async Task<AppointmentDto?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await MapQuery(db.Appointments.Where(a => a.Id == id)).FirstOrDefaultAsync(ct);

    private IQueryable<AppointmentDto> MapQuery(IQueryable<Appointment> source) =>
        from a in source
        join p in db.Patients on a.PatientId equals p.Id
        join d in db.Doctors on a.DoctorId equals d.Id
        join u in db.Users on d.UserId equals u.Id
        select new AppointmentDto(
            a.Id, p.Id, p.FullName, d.Id, u.FullName, a.Date, a.StartTime, a.EndTime, a.Status.ToString(), a.Notes);

    public async Task<IReadOnlyList<TimeOnly>> GetAvailableSlotsAsync(int doctorId, DateOnly date, CancellationToken ct = default)
    {
        var schedules = await db.DoctorSchedules
            .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek)
            .ToListAsync(ct);
        if (schedules.Count == 0) return [];

        var booked = await db.Appointments
            .Where(a => a.DoctorId == doctorId && a.Date == date && a.Status != AppointmentStatus.Cancelled)
            .Select(a => new { a.StartTime, a.EndTime })
            .ToListAsync(ct);

        var slots = new List<TimeOnly>();
        foreach (var schedule in schedules)
        {
            var slotStart = schedule.StartTime;
            var duration = TimeSpan.FromMinutes(schedule.SlotDurationMinutes);
            while (slotStart.Add(duration) <= schedule.EndTime)
            {
                var slotEnd = slotStart.Add(duration);
                var overlaps = booked.Any(b => slotStart < b.EndTime && slotEnd > b.StartTime);
                if (!overlaps) slots.Add(slotStart);
                slotStart = slotEnd;
            }
        }

        return slots;
    }

    public async Task<(CreateAppointmentResult, AppointmentDto?)> CreateAsync(
        CreateAppointmentRequest request, CancellationToken ct = default)
    {
        if (!await db.Patients.AnyAsync(p => p.Id == request.PatientId, ct))
            return (CreateAppointmentResult.PatientNotFound, null);

        if (!await db.Doctors.AnyAsync(d => d.Id == request.DoctorId, ct))
            return (CreateAppointmentResult.DoctorNotFound, null);

        var endTime = await ResolveSlotEndAsync(request.DoctorId, request.Date, request.StartTime, ct);
        if (endTime is null)
            return (CreateAppointmentResult.OutsideSchedule, null);

        if (await HasOverlapAsync(request.DoctorId, request.Date, request.StartTime, endTime.Value, excludeAppointmentId: null, ct))
            return (CreateAppointmentResult.SlotTaken, null);

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = endTime.Value,
            Status = AppointmentStatus.Scheduled,
            Notes = request.Notes
        };
        db.Appointments.Add(appointment);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return (CreateAppointmentResult.SlotTaken, null);
        }

        var dto = await GetByIdAsync(appointment.Id, ct);
        return (CreateAppointmentResult.Success, dto);
    }

    public async Task<(RescheduleAppointmentResult, AppointmentDto?)> RescheduleAsync(
        int id, RescheduleAppointmentRequest request, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FindAsync([id], ct);
        if (appointment is null) return (RescheduleAppointmentResult.NotFound, null);
        if (appointment.Status != AppointmentStatus.Scheduled) return (RescheduleAppointmentResult.NotReschedulable, null);

        var endTime = await ResolveSlotEndAsync(appointment.DoctorId, request.Date, request.StartTime, ct);
        if (endTime is null) return (RescheduleAppointmentResult.OutsideSchedule, null);

        if (await HasOverlapAsync(appointment.DoctorId, request.Date, request.StartTime, endTime.Value, excludeAppointmentId: id, ct))
            return (RescheduleAppointmentResult.SlotTaken, null);

        appointment.Date = request.Date;
        appointment.StartTime = request.StartTime;
        appointment.EndTime = endTime.Value;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return (RescheduleAppointmentResult.SlotTaken, null);
        }

        var dto = await GetByIdAsync(id, ct);
        return (RescheduleAppointmentResult.Success, dto);
    }

    public async Task<bool> CancelAsync(int id, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FindAsync([id], ct);
        if (appointment is null || appointment.Status != AppointmentStatus.Scheduled) return false;

        appointment.Status = AppointmentStatus.Cancelled;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> CompleteAsync(int id, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FindAsync([id], ct);
        if (appointment is null || appointment.Status != AppointmentStatus.Scheduled) return false;

        appointment.Status = AppointmentStatus.Completed;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<TimeOnly?> ResolveSlotEndAsync(int doctorId, DateOnly date, TimeOnly startTime, CancellationToken ct)
    {
        var schedules = await db.DoctorSchedules
            .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek)
            .ToListAsync(ct);

        foreach (var schedule in schedules)
        {
            var endTime = startTime.Add(TimeSpan.FromMinutes(schedule.SlotDurationMinutes));
            if (startTime >= schedule.StartTime && endTime <= schedule.EndTime)
                return endTime;
        }

        return null;
    }

    private async Task<bool> HasOverlapAsync(
        int doctorId, DateOnly date, TimeOnly startTime, TimeOnly endTime, int? excludeAppointmentId, CancellationToken ct)
    {
        var query = db.Appointments.Where(a =>
            a.DoctorId == doctorId &&
            a.Date == date &&
            a.Status != AppointmentStatus.Cancelled &&
            startTime < a.EndTime && endTime > a.StartTime);

        if (excludeAppointmentId is not null)
            query = query.Where(a => a.Id != excludeAppointmentId);

        return await query.AnyAsync(ct);
    }
}
