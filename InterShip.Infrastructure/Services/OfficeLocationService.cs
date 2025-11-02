using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class OfficeLocationService : IOfficeLocationService
    {
        private readonly InterShipDbContext _context;

        public OfficeLocationService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<OfficeLocation>> GetAllOfficeLocationsAsync()
        {
            return await _context.OfficeLocations.ToListAsync();
        }

        public async Task<OfficeLocation?> GetOfficeLocationByIdAsync(int id)
        {
            return await _context.OfficeLocations.FindAsync(id);
        }

        public async Task<OfficeLocation> CreateOfficeLocationAsync(OfficeLocation officeLocation)
        {
            _context.OfficeLocations.Add(officeLocation);
            await _context.SaveChangesAsync();
            return officeLocation;
        }

        public async Task<OfficeLocation> UpdateOfficeLocationAsync(OfficeLocation officeLocation)
        {
            _context.OfficeLocations.Update(officeLocation);
            await _context.SaveChangesAsync();
            return officeLocation;
        }

        public async Task<bool> DeleteOfficeLocationAsync(int id)
        {
            var officeLocation = await _context.OfficeLocations.FindAsync(id);
            if (officeLocation == null)
                return false;

            _context.OfficeLocations.Remove(officeLocation);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}






