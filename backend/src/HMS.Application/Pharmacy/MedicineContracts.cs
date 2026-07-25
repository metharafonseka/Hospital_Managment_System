using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Pharmacy;

public record MedicineDto(
    int Id, string Name, string Unit, int StockQuantity, decimal UnitPrice, DateOnly ExpiryDate, int ReorderThreshold);

public record CreateMedicineRequest(
    [Required, StringLength(200)] string Name,
    [Required, StringLength(50)] string Unit,
    [Range(0, int.MaxValue)] int StockQuantity,
    [Range(0, 1000000)] decimal UnitPrice,
    [Required] DateOnly ExpiryDate,
    [Range(0, int.MaxValue)] int ReorderThreshold);

public record UpdateMedicineRequest(
    [Required, StringLength(200)] string Name,
    [Required, StringLength(50)] string Unit,
    [Range(0, 1000000)] decimal UnitPrice,
    [Required] DateOnly ExpiryDate,
    [Range(0, int.MaxValue)] int ReorderThreshold);

public record AdjustStockRequest(int QuantityDelta);
