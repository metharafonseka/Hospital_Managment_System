using HMS.Application.Users;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = Roles.Administrator)]
public class UsersController(IUserService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll(CancellationToken ct) =>
        Ok(await service.GetAllAsync(ct));

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request, CancellationToken ct)
    {
        var (result, user, errors) = await service.CreateAsync(request, ct);
        return result switch
        {
            CreateUserResult.Success => StatusCode(StatusCodes.Status201Created, user),
            CreateUserResult.InvalidRole => BadRequest(new { message = "Invalid role." }),
            CreateUserResult.EmailInUse => BadRequest(new { message = "Email already in use.", errors }),
            _ => BadRequest()
        };
    }

    [HttpPut("{id}/active")]
    public async Task<IActionResult> SetActive(string id, SetUserActiveRequest request, CancellationToken ct)
    {
        var found = await service.SetActiveAsync(id, request.IsActive, ct);
        return found ? NoContent() : NotFound();
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> SetRole(string id, UpdateUserRoleRequest request, CancellationToken ct)
    {
        var (found, roleValid) = await service.SetRoleAsync(id, request.Role, ct);
        if (!roleValid) return BadRequest(new { message = "Invalid role." });
        return found ? NoContent() : NotFound();
    }
}
