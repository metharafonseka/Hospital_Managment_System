using HMS.Application.Users;
using HMS.Domain.Constants;
using HMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Users;

public class UserService(UserManager<ApplicationUser> userManager) : IUserService
{
    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await userManager.Users.ToListAsync(ct);
        var result = new List<UserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserDto(user.Id, user.Email!, user.FullName, user.IsActive, roles));
        }
        return result;
    }

    public async Task<(CreateUserResult, UserDto?, IEnumerable<string>?)> CreateAsync(
        CreateUserRequest request, CancellationToken ct = default)
    {
        if (!Roles.All.Contains(request.Role))
            return (CreateUserResult.InvalidRole, null, null);

        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return (CreateUserResult.EmailInUse, null, null);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return (CreateUserResult.EmailInUse, null, result.Errors.Select(e => e.Description));

        await userManager.AddToRoleAsync(user, request.Role);
        return (CreateUserResult.Success, new UserDto(user.Id, user.Email!, user.FullName, user.IsActive, [request.Role]), null);
    }

    public async Task<bool> SetActiveAsync(string userId, bool isActive, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return false;

        user.IsActive = isActive;
        await userManager.UpdateAsync(user);
        return true;
    }

    public async Task<(bool Found, bool RoleValid)> SetRoleAsync(string userId, string role, CancellationToken ct = default)
    {
        if (!Roles.All.Contains(role)) return (true, false);

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return (false, true);

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, role);
        return (true, true);
    }
}
