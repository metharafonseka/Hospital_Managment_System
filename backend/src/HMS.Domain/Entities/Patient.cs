namespace HMS.Domain.Entities;

public class Patient
{
    public int Id { get; set; }
    public string PatientCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
