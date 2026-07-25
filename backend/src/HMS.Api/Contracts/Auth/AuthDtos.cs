namespace HMS.Api.Contracts.Auth;

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    string UserId,
    string Email,
    string FullName,
    IEnumerable<string> Roles);
