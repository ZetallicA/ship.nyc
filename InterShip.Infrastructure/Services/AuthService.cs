using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;

namespace InterShip.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly InterShipDbContext _context;

        public AuthService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<AuthUser?> LoginAsync(string username, string password)
        {
            var user = await _context.AuthUsers
                .FirstOrDefaultAsync(u => (u.Username == username || u.Email == username) && u.IsActive);

            if (user == null)
                return null;

            if (!VerifyPassword(password, user.PasswordHash))
                return null;

            user.LastLoginDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<AuthUser> RegisterAsync(AuthUser user, string password)
        {
            user.PasswordHash = HashPassword(password);
            user.CreatedDate = DateTime.UtcNow;
            
            _context.AuthUsers.Add(user);
            await _context.SaveChangesAsync();
            
            return user;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            var user = await _context.AuthUsers
                .FirstOrDefaultAsync(u => u.RefreshToken == token && 
                                    u.RefreshTokenExpiry > DateTime.UtcNow && 
                                    u.IsActive);
            return user != null;
        }

        public async Task<AuthUser?> GetUserByTokenAsync(string token)
        {
            return await _context.AuthUsers
                .FirstOrDefaultAsync(u => u.RefreshToken == token && 
                                    u.RefreshTokenExpiry > DateTime.UtcNow && 
                                    u.IsActive);
        }

        public async Task<string> GenerateTokenAsync(AuthUser user)
        {
            var token = Guid.NewGuid().ToString();
            user.RefreshToken = token;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            
            await _context.SaveChangesAsync();
            return token;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null || !VerifyPassword(currentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResetPasswordAsync(string email)
        {
            var user = await _context.AuthUsers
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
            
            if (user == null)
                return false;

            // In a real application, you would send an email with reset instructions
            // For now, we'll just return true
            return true;
        }

        public async Task<AuthUser?> GetUserByIdAsync(int userId)
        {
            return await _context.AuthUsers
                .FirstOrDefaultAsync(u => u.AuthUserID == userId && u.IsActive);
        }

        public async Task<AuthUser> UpdateUserAsync(AuthUser user)
        {
            _context.AuthUsers.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return false;

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AuthUser>> GetAllUsersAsync()
        {
            return await _context.AuthUsers
                .Where(u => u.IsActive)
                .ToListAsync();
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }
}


