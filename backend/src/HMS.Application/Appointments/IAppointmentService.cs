namespace HMS.Application.Appointments;

public interface IAppointmentService
{
    Task<IReadOnlyList<AppointmentDto>> GetAllAsync(
        int? doctorId, int? patientId, DateOnly? date, CancellationToken ct = default);

    Task<AppointmentDto?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<IReadOnlyList<TimeOnly>> GetAvailableSlotsAsync(int doctorId, DateOnly date, CancellationToken ct = default);

    Task<(CreateAppointmentResult Result, AppointmentDto? Appointment)> CreateAsync(
        CreateAppointmentRequest request, CancellationToken ct = default);

    Task<(RescheduleAppointmentResult Result, AppointmentDto? Appointment)> RescheduleAsync(
        int id, RescheduleAppointmentRequest request, CancellationToken ct = default);

    Task<bool> CancelAsync(int id, CancellationToken ct = default);
    Task<bool> CompleteAsync(int id, CancellationToken ct = default);
}
