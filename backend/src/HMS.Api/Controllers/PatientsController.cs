using HMS.Application.Patients;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/patients")]
[Authorize]
public class PatientsController(IPatientService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PatientDto>>> Search([FromQuery] string? search, CancellationToken ct) =>
        Ok(await service.SearchAsync(search, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientDto>> GetById(int id, CancellationToken ct)
    {
        var patient = await service.GetByIdAsync(id, ct);
        return patient is null ? NotFound() : Ok(patient);
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpPost]
    public async Task<ActionResult<PatientDto>> Create(CreatePatientRequest request, CancellationToken ct)
    {
        var patient = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
    }

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Receptionist}")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PatientDto>> Update(int id, UpdatePatientRequest request, CancellationToken ct)
    {
        var patient = await service.UpdateAsync(id, request, ct);
        return patient is null ? NotFound() : Ok(patient);
    }
}
