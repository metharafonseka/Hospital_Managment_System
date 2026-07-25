using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class Invoice
{
    public int Id { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }

    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
