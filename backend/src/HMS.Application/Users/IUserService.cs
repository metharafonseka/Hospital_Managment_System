namespace HMS.Application.Users;

public interface IUserService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default);

    Task<(CreateUserResult Result, UserDto? User, IEnumerable<string>? Errors)> CreateAsync(
        CreateUserRequest request, CancellationToken ct = default);

    Task<bool> SetActiveAsync(string userId, bool isActive, CancellationToken ct = default);
    Task<(bool Found, bool RoleValid)> SetRoleAsync(string userId, string role, CancellationToken ct = default);
}
