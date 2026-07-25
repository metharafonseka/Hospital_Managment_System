using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Users;

public record UserDto(string Id, string Email, string FullName, bool IsActive, IEnumerable<string> Roles);

public record CreateUserRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string Role);

public record SetUserActiveRequest(bool IsActive);

public record UpdateUserRoleRequest([Required] string Role);

public enum CreateUserResult { Success, EmailInUse, InvalidRole }
