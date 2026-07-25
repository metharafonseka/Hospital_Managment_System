using HMS.Api.Contracts.Auth;
using HMS.Api.Services;
using HMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        return await IssueTokensAsync(user);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var user = userManager.Users.FirstOrDefault(u => u.RefreshToken == request.RefreshToken);
        if (user is null || user.RefreshTokenExpiryUtc is null || user.RefreshTokenExpiryUtc < DateTime.UtcNow)
        {
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }

        return await IssueTokensAsync(user);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiryUtc = null;
        await userManager.UpdateAsync(user);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        return NoContent();
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.CreateAccessToken(user.Id, user.Email!, roles);
        var refreshToken = tokenService.CreateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryUtc = DateTime.UtcNow.AddDays(
            double.Parse(configuration["Jwt:RefreshTokenDays"]!));
        await userManager.UpdateAsync(user);

        return new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            refreshToken,
            user.Id,
            user.Email!,
            user.FullName,
            roles);
    }
}
