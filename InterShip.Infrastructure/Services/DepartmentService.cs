using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly InterShipDbContext _context;

        public DepartmentService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.OfficeLocation)
                .Include(d => d.Users)
                .Where(d => d.IsActive)
                .ToListAsync();
        }

        public async Task<Department?> GetDepartmentByIdAsync(int id)
        {
            return await _context.Departments
                .Include(d => d.OfficeLocation)
                .Include(d => d.Users)
                .FirstOrDefaultAsync(d => d.DepartmentID == id && d.IsActive);
        }

        public async Task<Department> CreateDepartmentAsync(Department department)
        {
            department.CreatedDate = DateTime.UtcNow;
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<Department> UpdateDepartmentAsync(Department department)
        {
            _context.Departments.Update(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<bool> DeleteDepartmentAsync(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
                return false;

            // Soft delete
            department.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Department>> GetDepartmentsByOfficeLocationAsync(int officeLocationId)
        {
            return await _context.Departments
                .Include(d => d.OfficeLocation)
                .Include(d => d.Users)
                .Where(d => d.OfficeLocationID == officeLocationId && d.IsActive)
                .ToListAsync();
        }
    }
}


