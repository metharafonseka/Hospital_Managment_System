namespace HMS.Application.Pharmacy;

public interface IMedicineService
{
    Task<IReadOnlyList<MedicineDto>> GetAllAsync(bool? lowStock, bool? expiringSoon, CancellationToken ct = default);
    Task<MedicineDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<MedicineDto> CreateAsync(CreateMedicineRequest request, CancellationToken ct = default);
    Task<MedicineDto?> UpdateAsync(int id, UpdateMedicineRequest request, CancellationToken ct = default);
    Task<(bool Found, bool Sufficient, MedicineDto? Medicine)> AdjustStockAsync(
        int id, AdjustStockRequest request, CancellationToken ct = default);
}
