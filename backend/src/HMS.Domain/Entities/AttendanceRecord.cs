using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class AttendanceRecord
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public string? Notes { get; set; }
}
