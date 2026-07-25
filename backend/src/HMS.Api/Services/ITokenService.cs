namespace HMS.Api.Services;

public record AccessToken(string Token, DateTime ExpiresAtUtc);

public interface ITokenService
{
    AccessToken CreateAccessToken(string userId, string email, IEnumerable<string> roles);
    string CreateRefreshToken();
}
