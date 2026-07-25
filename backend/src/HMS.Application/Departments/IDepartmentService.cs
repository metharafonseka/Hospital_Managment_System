namespace HMS.Application.Departments;

public interface IDepartmentService
{
    Task<IReadOnlyList<DepartmentDto>> GetAllAsync(CancellationToken ct = default);
    Task<DepartmentDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<DepartmentDto> CreateAsync(CreateDepartmentRequest request, CancellationToken ct = default);
    Task<DepartmentDto?> UpdateAsync(int id, UpdateDepartmentRequest request, CancellationToken ct = default);
    Task<DeleteDepartmentResult> DeleteAsync(int id, CancellationToken ct = default);
}
