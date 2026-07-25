using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Departments;

public record DepartmentDto(int Id, string Name, string? Description, int DoctorCount);

public record CreateDepartmentRequest(
    [Required, StringLength(200)] string Name,
    string? Description);

public record UpdateDepartmentRequest(
    [Required, StringLength(200)] string Name,
    string? Description);

public enum DeleteDepartmentResult { NotFound, HasDoctors, Deleted }
