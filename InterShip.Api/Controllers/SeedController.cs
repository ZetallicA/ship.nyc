using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;

namespace InterShip.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly InterShipDbContext _context;
        private readonly ILogger<SeedController> _logger;

        public SeedController(InterShipDbContext context, ILogger<SeedController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("admin")]
        public async Task<ActionResult> SeedAdmin()
        {
            try
            {
                // Check if admin user already exists
                var existingAdmin = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Username == "admin");
                if (existingAdmin != null)
                {
                    return Ok(new { message = "Admin user already exists" });
                }

                // Create admin user
                var adminUser = new AuthUser
                {
                    Username = "admin",
                    Email = "admin@intership.com",
                    PasswordHash = HashPassword("admin123"),
                    Role = "Admin",
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };

                _context.AuthUsers.Add(adminUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Admin user created successfully!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding admin user");
                return StatusCode(500, new { message = "Error creating admin user", error = ex.Message });
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}
