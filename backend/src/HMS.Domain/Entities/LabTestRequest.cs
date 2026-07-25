using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class LabTestRequest
{
    public int Id { get; set; }

    public int MedicalRecordId { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public string TestName { get; set; } = string.Empty;
    public LabTestStatus Status { get; set; } = LabTestStatus.Requested;
    public decimal Price { get; set; }

    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? SampleCollectedAtUtc { get; set; }
    public string? ResultText { get; set; }
    public DateTime? ResultEnteredAtUtc { get; set; }
}
