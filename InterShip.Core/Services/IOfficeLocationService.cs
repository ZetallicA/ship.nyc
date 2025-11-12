using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface IOfficeLocationService
    {
        Task<IEnumerable<OfficeLocation>> GetAllOfficeLocationsAsync();
        Task<OfficeLocation?> GetOfficeLocationByIdAsync(int id);
        Task<OfficeLocation> CreateOfficeLocationAsync(OfficeLocation officeLocation);
        Task<OfficeLocation> UpdateOfficeLocationAsync(OfficeLocation officeLocation);
        Task<bool> DeleteOfficeLocationAsync(int id);
    }
}













