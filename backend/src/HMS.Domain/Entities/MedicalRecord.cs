namespace HMS.Domain.Entities;

public class MedicalRecord
{
    public int Id { get; set; }

    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
}
