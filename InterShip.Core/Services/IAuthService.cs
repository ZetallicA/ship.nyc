using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface IAuthService
    {
        Task<AuthUser?> LoginAsync(string username, string password);
        Task<AuthUser> RegisterAsync(AuthUser user, string password);
        Task<bool> ValidateTokenAsync(string token);
        Task<AuthUser?> GetUserByTokenAsync(string token);
        Task<string> GenerateTokenAsync(AuthUser user);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<bool> ResetPasswordAsync(string email);
        Task<AuthUser?> GetUserByIdAsync(int userId);
        Task<AuthUser> UpdateUserAsync(AuthUser user);
        Task<bool> DeleteUserAsync(int userId);
        Task<IEnumerable<AuthUser>> GetAllUsersAsync();
    }
}


