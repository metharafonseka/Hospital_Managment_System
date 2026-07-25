using HMS.Application.Pharmacy;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/medicines")]
[Authorize(Roles = $"{Roles.Administrator},{Roles.Pharmacist}")]
public class MedicinesController(IMedicineService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MedicineDto>>> GetAll(
        [FromQuery] bool? lowStock, [FromQuery] bool? expiringSoon, CancellationToken ct) =>
        Ok(await service.GetAllAsync(lowStock, expiringSoon, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MedicineDto>> GetById(int id, CancellationToken ct)
    {
        var medicine = await service.GetByIdAsync(id, ct);
        return medicine is null ? NotFound() : Ok(medicine);
    }

    [HttpPost]
    public async Task<ActionResult<MedicineDto>> Create(CreateMedicineRequest request, CancellationToken ct)
    {
        var medicine = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MedicineDto>> Update(int id, UpdateMedicineRequest request, CancellationToken ct)
    {
        var medicine = await service.UpdateAsync(id, request, ct);
        return medicine is null ? NotFound() : Ok(medicine);
    }

    [HttpPut("{id:int}/stock")]
    public async Task<ActionResult<MedicineDto>> AdjustStock(int id, AdjustStockRequest request, CancellationToken ct)
    {
        var (found, sufficient, medicine) = await service.AdjustStockAsync(id, request, ct);
        if (!found) return NotFound();
        if (!sufficient) return BadRequest(new { message = "Adjustment would result in negative stock." });
        return Ok(medicine);
    }
}
