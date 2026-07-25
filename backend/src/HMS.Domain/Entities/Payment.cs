namespace HMS.Domain.Entities;

public class Payment
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
}
