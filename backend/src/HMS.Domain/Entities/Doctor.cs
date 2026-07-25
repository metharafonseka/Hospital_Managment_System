namespace HMS.Domain.Entities;

public class Doctor
{
    public int Id { get; set; }

    // FK to ApplicationUser.Id (Identity lives in Infrastructure; Domain stays framework-free)
    public string UserId { get; set; } = string.Empty;

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Specialization { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }

    public ICollection<DoctorSchedule> Schedules { get; set; } = new List<DoctorSchedule>();
}
