using HMS.Application.Departments;
using HMS.Domain.Entities;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Departments;

public class DepartmentService(ApplicationDbContext db) : IDepartmentService
{
    public async Task<IReadOnlyList<DepartmentDto>> GetAllAsync(CancellationToken ct = default) =>
        await MapQuery().ToListAsync(ct);

    public async Task<DepartmentDto?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await MapQuery().FirstOrDefaultAsync(d => d.Id == id, ct);

    private IQueryable<DepartmentDto> MapQuery() =>
        db.Departments.Select(d => new DepartmentDto(d.Id, d.Name, d.Description, d.Doctors.Count));

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentRequest request, CancellationToken ct = default)
    {
        var department = new Department { Name = request.Name, Description = request.Description };
        db.Departments.Add(department);
        await db.SaveChangesAsync(ct);
        return new DepartmentDto(department.Id, department.Name, department.Description, 0);
    }

    public async Task<DepartmentDto?> UpdateAsync(int id, UpdateDepartmentRequest request, CancellationToken ct = default)
    {
        var department = await db.Departments.FindAsync([id], ct);
        if (department is null) return null;

        department.Name = request.Name;
        department.Description = request.Description;
        await db.SaveChangesAsync(ct);

        var doctorCount = await db.Doctors.CountAsync(doc => doc.DepartmentId == id, ct);
        return new DepartmentDto(department.Id, department.Name, department.Description, doctorCount);
    }

    public async Task<DeleteDepartmentResult> DeleteAsync(int id, CancellationToken ct = default)
    {
        var department = await db.Departments.Include(d => d.Doctors).FirstOrDefaultAsync(d => d.Id == id, ct);
        if (department is null) return DeleteDepartmentResult.NotFound;
        if (department.Doctors.Count > 0) return DeleteDepartmentResult.HasDoctors;

        db.Departments.Remove(department);
        await db.SaveChangesAsync(ct);
        return DeleteDepartmentResult.Deleted;
    }
}
