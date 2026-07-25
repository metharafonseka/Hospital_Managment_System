using HMS.Application.Pharmacy;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/prescriptions")]
[Authorize(Roles = $"{Roles.Administrator},{Roles.Pharmacist}")]
public class PrescriptionsController(IPrescriptionProcessingService service) : ControllerBase
{
    [HttpGet("pending")]
    public async Task<ActionResult<IReadOnlyList<PendingPrescriptionDto>>> GetPending(CancellationToken ct) =>
        Ok(await service.GetPendingAsync(ct));

    [HttpGet("patient/{patientId:int}")]
    public async Task<ActionResult<IReadOnlyList<PendingPrescriptionDto>>> GetByPatient(int patientId, CancellationToken ct) =>
        Ok(await service.GetByPatientIdAsync(patientId, ct));

    [HttpPut("{id:int}/dispense")]
    public async Task<IActionResult> Dispense(int id, DispenseRequest request, CancellationToken ct)
    {
        var result = await service.DispenseAsync(id, request, ct);
        return result switch
        {
            DispenseResult.Success => NoContent(),
            DispenseResult.PrescriptionNotFound => NotFound(),
            DispenseResult.InvalidState => BadRequest(new { message = "This prescription has already been dispensed or cancelled." }),
            DispenseResult.MedicineNotFound => BadRequest(new { message = "Medicine not found." }),
            DispenseResult.InsufficientStock => Conflict(new { message = "Insufficient stock for this quantity." }),
            _ => BadRequest()
        };
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        var cancelled = await service.CancelAsync(id, ct);
        return cancelled ? NoContent() : NotFound();
    }
}
