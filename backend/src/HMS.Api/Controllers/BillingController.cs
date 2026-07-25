using HMS.Application.Billing;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/invoices")]
[Authorize(Roles = $"{Roles.Administrator},{Roles.Accountant},{Roles.Receptionist}")]
public class BillingController(IBillingService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InvoiceDto>>> GetAll(
        [FromQuery] int? patientId, [FromQuery] string? status, CancellationToken ct) =>
        Ok(await service.GetAllAsync(patientId, status, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDto>> GetById(int id, CancellationToken ct)
    {
        var invoice = await service.GetByIdAsync(id, ct);
        return invoice is null ? NotFound() : Ok(invoice);
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Accountant}")]
    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> Generate(GenerateInvoiceRequest request, CancellationToken ct)
    {
        var (result, invoice) = await service.GenerateAsync(request, ct);
        return result switch
        {
            GenerateInvoiceResult.Success => CreatedAtAction(nameof(GetById), new { id = invoice!.Id }, invoice),
            GenerateInvoiceResult.PatientNotFound => BadRequest(new { message = "Patient not found." }),
            GenerateInvoiceResult.NothingToBill => BadRequest(new { message = "No unbilled charges found for this patient." }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Accountant}")]
    [HttpPost("{id:int}/payments")]
    public async Task<ActionResult<InvoiceDto>> RecordPayment(int id, RecordPaymentRequest request, CancellationToken ct)
    {
        var (result, invoice) = await service.RecordPaymentAsync(id, request, ct);
        return result switch
        {
            RecordPaymentResult.Success => Ok(invoice),
            RecordPaymentResult.InvoiceNotFound => NotFound(),
            RecordPaymentResult.ExceedsBalance => BadRequest(new { message = "Payment exceeds the outstanding balance." }),
            _ => BadRequest()
        };
    }
}
