using HMS.Application.Laboratory;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/lab-tests")]
[Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor},{Roles.Nurse},{Roles.LaboratoryStaff}")]
public class LaboratoryController(ILabTestService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LabTestRequestDto>>> GetAll([FromQuery] string? status, CancellationToken ct) =>
        Ok(await service.GetAllAsync(status, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LabTestRequestDto>> GetById(int id, CancellationToken ct)
    {
        var record = await service.GetByIdAsync(id, ct);
        return record is null ? NotFound() : Ok(record);
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.LaboratoryStaff}")]
    [HttpPut("{id:int}/collect-sample")]
    public async Task<IActionResult> CollectSample(int id, CancellationToken ct)
    {
        var result = await service.CollectSampleAsync(id, ct);
        return result switch
        {
            LabTestActionResult.Success => NoContent(),
            LabTestActionResult.NotFound => NotFound(),
            LabTestActionResult.InvalidState => BadRequest(new { message = "Sample can only be collected for a requested test." }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.LaboratoryStaff}")]
    [HttpPut("{id:int}/result")]
    public async Task<IActionResult> EnterResult(int id, EnterResultRequest request, CancellationToken ct)
    {
        var result = await service.EnterResultAsync(id, request, ct);
        return result switch
        {
            LabTestActionResult.Success => NoContent(),
            LabTestActionResult.NotFound => NotFound(),
            LabTestActionResult.InvalidState => BadRequest(new { message = "A result can only be entered once the sample is collected." }),
            _ => BadRequest()
        };
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.LaboratoryStaff}")]
    [HttpPut("{id:int}/price")]
    public async Task<IActionResult> SetPrice(int id, SetLabTestPriceRequest request, CancellationToken ct)
    {
        var found = await service.SetPriceAsync(id, request, ct);
        return found ? NoContent() : NotFound();
    }
}
