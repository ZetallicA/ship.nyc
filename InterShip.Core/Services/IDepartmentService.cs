using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface IDepartmentService
    {
        Task<IEnumerable<Department>> GetAllDepartmentsAsync();
        Task<Department?> GetDepartmentByIdAsync(int id);
        Task<Department> CreateDepartmentAsync(Department department);
        Task<Department> UpdateDepartmentAsync(Department department);
        Task<bool> DeleteDepartmentAsync(int id);
        Task<IEnumerable<Department>> GetDepartmentsByOfficeLocationAsync(int officeLocationId);
    }
}


