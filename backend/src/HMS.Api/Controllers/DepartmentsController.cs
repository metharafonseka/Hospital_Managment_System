using HMS.Application.Departments;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/departments")]
[Authorize]
public class DepartmentsController(IDepartmentService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DepartmentDto>>> GetAll(CancellationToken ct) =>
        Ok(await service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> GetById(int id, CancellationToken ct)
    {
        var department = await service.GetByIdAsync(id, ct);
        return department is null ? NotFound() : Ok(department);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create(CreateDepartmentRequest request, CancellationToken ct)
    {
        var department = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> Update(int id, UpdateDepartmentRequest request, CancellationToken ct)
    {
        var department = await service.UpdateAsync(id, request, ct);
        return department is null ? NotFound() : Ok(department);
    }

    [Authorize(Roles = Roles.Administrator)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var result = await service.DeleteAsync(id, ct);
        return result switch
        {
            DeleteDepartmentResult.Deleted => NoContent(),
            DeleteDepartmentResult.HasDoctors => Conflict(new { message = "Cannot delete a department with assigned doctors." }),
            _ => NotFound()
        };
    }
}
