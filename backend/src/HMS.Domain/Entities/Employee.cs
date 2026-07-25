namespace HMS.Domain.Entities;

public class Employee
{
    public int Id { get; set; }

    // FK to ApplicationUser.Id (Identity lives in Infrastructure; Domain stays framework-free)
    public string UserId { get; set; } = string.Empty;

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string JobTitle { get; set; } = string.Empty;
    public DateOnly HireDate { get; set; }
}
