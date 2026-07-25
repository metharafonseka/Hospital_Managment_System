namespace HMS.Application.Doctors;

public interface IDoctorService
{
    Task<IReadOnlyList<DoctorDto>> GetAllAsync(CancellationToken ct = default);
    Task<DoctorDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<DoctorDto?> GetByUserIdAsync(string userId, CancellationToken ct = default);

    Task<(CreateDoctorResult Result, DoctorDto? Doctor, IEnumerable<string>? Errors)> CreateAsync(
        CreateDoctorRequest request, CancellationToken ct = default);

    Task<(bool Found, bool DepartmentValid, DoctorDto? Doctor)> UpdateAsync(
        int id, UpdateDoctorRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<DoctorScheduleDto>> GetSchedulesAsync(int doctorId, CancellationToken ct = default);
    Task<DoctorScheduleDto?> AddScheduleAsync(int doctorId, CreateDoctorScheduleRequest request, CancellationToken ct = default);
    Task<bool> RemoveScheduleAsync(int doctorId, int scheduleId, CancellationToken ct = default);
}
