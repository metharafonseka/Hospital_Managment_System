using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class PrescriptionItem
{
    public int Id { get; set; }

    public int MedicalRecordId { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }

    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int? DurationDays { get; set; }
    public string? Instructions { get; set; }

    public PrescriptionItemStatus Status { get; set; } = PrescriptionItemStatus.Pending;

    public int? DispensedMedicineId { get; set; }
    public Medicine? DispensedMedicine { get; set; }
    public int? DispensedQuantity { get; set; }
    public decimal? UnitPriceAtDispense { get; set; }
    public DateTime? DispensedAtUtc { get; set; }
}
