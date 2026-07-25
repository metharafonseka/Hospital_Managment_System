using HMS.Application.Pharmacy;
using HMS.Domain.Entities;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Pharmacy;

public class MedicineService(ApplicationDbContext db) : IMedicineService
{
    public async Task<IReadOnlyList<MedicineDto>> GetAllAsync(bool? lowStock, bool? expiringSoon, CancellationToken ct = default)
    {
        var query = db.Medicines.AsQueryable();
        if (lowStock == true) query = query.Where(m => m.StockQuantity <= m.ReorderThreshold);
        if (expiringSoon == true)
        {
            var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
            query = query.Where(m => m.ExpiryDate <= cutoff);
        }

        return await query.OrderBy(m => m.Name).Select(m => Map(m)).ToListAsync(ct);
    }

    public async Task<MedicineDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var medicine = await db.Medicines.FindAsync([id], ct);
        return medicine is null ? null : Map(medicine);
    }

    public async Task<MedicineDto> CreateAsync(CreateMedicineRequest request, CancellationToken ct = default)
    {
        var medicine = new Medicine
        {
            Name = request.Name,
            Unit = request.Unit,
            StockQuantity = request.StockQuantity,
            UnitPrice = request.UnitPrice,
            ExpiryDate = request.ExpiryDate,
            ReorderThreshold = request.ReorderThreshold
        };
        db.Medicines.Add(medicine);
        await db.SaveChangesAsync(ct);
        return Map(medicine);
    }

    public async Task<MedicineDto?> UpdateAsync(int id, UpdateMedicineRequest request, CancellationToken ct = default)
    {
        var medicine = await db.Medicines.FindAsync([id], ct);
        if (medicine is null) return null;

        medicine.Name = request.Name;
        medicine.Unit = request.Unit;
        medicine.UnitPrice = request.UnitPrice;
        medicine.ExpiryDate = request.ExpiryDate;
        medicine.ReorderThreshold = request.ReorderThreshold;
        await db.SaveChangesAsync(ct);
        return Map(medicine);
    }

    public async Task<(bool Found, bool Sufficient, MedicineDto? Medicine)> AdjustStockAsync(
        int id, AdjustStockRequest request, CancellationToken ct = default)
    {
        var medicine = await db.Medicines.FindAsync([id], ct);
        if (medicine is null) return (false, true, null);

        var newQuantity = medicine.StockQuantity + request.QuantityDelta;
        if (newQuantity < 0) return (true, false, null);

        medicine.StockQuantity = newQuantity;
        await db.SaveChangesAsync(ct);
        return (true, true, Map(medicine));
    }

    private static MedicineDto Map(Medicine m) =>
        new(m.Id, m.Name, m.Unit, m.StockQuantity, m.UnitPrice, m.ExpiryDate, m.ReorderThreshold);
}
