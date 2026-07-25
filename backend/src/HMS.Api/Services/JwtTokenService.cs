using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace HMS.Api.Services;

public class JwtTokenService(IConfiguration configuration) : ITokenService
{
    private readonly IConfiguration _jwt = configuration.GetSection("Jwt");

    public AccessToken CreateAccessToken(string userId, string email, IEnumerable<string> roles)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(double.Parse(_jwt["AccessTokenMinutes"]!));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt["Issuer"],
            audience: _jwt["Audience"],
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
