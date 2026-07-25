namespace HMS.Domain.Entities;

public class Medicine
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public int ReorderThreshold { get; set; } = 10;
}
