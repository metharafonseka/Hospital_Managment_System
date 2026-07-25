using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class InvoiceLineItem
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public ChargeType ChargeType { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    /// <summary>FK to the originating MedicalRecord/LabTestRequest/PrescriptionItem, used to avoid double-billing. Null for manual (e.g. admission) charges.</summary>
    public int? SourceReferenceId { get; set; }
}
