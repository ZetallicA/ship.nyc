using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly InterShipDbContext _context;

        public UserService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.OfficeLocation)
                .ToListAsync();
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.OfficeLocation)
                .FirstOrDefaultAsync(u => u.UserID == id);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.OfficeLocation)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User> CreateUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<User>> GetUsersByRoleAsync(string role)
        {
            return await _context.Users
                .Include(u => u.OfficeLocation)
                .Where(u => u.Role == role)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetUsersByOfficeLocationAsync(int officeLocationId)
        {
            return await _context.Users
                .Include(u => u.OfficeLocation)
                .Where(u => u.OfficeLocationID == officeLocationId)
                .ToListAsync();
        }
    }
}












