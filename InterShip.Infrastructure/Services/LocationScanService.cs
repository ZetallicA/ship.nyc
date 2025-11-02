using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class LocationScanService : ILocationScanService
    {
        private readonly InterShipDbContext _context;

        public LocationScanService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<LocationScan>> GetAllLocationScansAsync()
        {
            return await _context.LocationScans
                .Include(l => l.Shipment)
                .Include(l => l.OfficeLocation)
                .Include(l => l.ScannedByUser)
                .OrderByDescending(l => l.ScanDate)
                .ToListAsync();
        }

        public async Task<LocationScan?> GetLocationScanByIdAsync(int id)
        {
            return await _context.LocationScans
                .Include(l => l.Shipment)
                .Include(l => l.OfficeLocation)
                .Include(l => l.ScannedByUser)
                .FirstOrDefaultAsync(l => l.LocationScanID == id);
        }

        public async Task<LocationScan> CreateLocationScanAsync(LocationScan locationScan)
        {
            locationScan.ScanDate = DateTime.UtcNow;
            _context.LocationScans.Add(locationScan);
            await _context.SaveChangesAsync();
            return locationScan;
        }

        public async Task<LocationScan> UpdateLocationScanAsync(LocationScan locationScan)
        {
            _context.LocationScans.Update(locationScan);
            await _context.SaveChangesAsync();
            return locationScan;
        }

        public async Task<bool> DeleteLocationScanAsync(int id)
        {
            var locationScan = await _context.LocationScans.FindAsync(id);
            if (locationScan == null)
                return false;

            _context.LocationScans.Remove(locationScan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<LocationScan>> GetLocationScansByShipmentAsync(int shipmentId)
        {
            return await _context.LocationScans
                .Include(l => l.Shipment)
                .Include(l => l.OfficeLocation)
                .Include(l => l.ScannedByUser)
                .Where(l => l.ShipmentID == shipmentId)
                .OrderBy(l => l.ScanDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<LocationScan>> GetLocationScansByLocationAsync(int officeLocationId)
        {
            return await _context.LocationScans
                .Include(l => l.Shipment)
                .Include(l => l.OfficeLocation)
                .Include(l => l.ScannedByUser)
                .Where(l => l.OfficeLocationID == officeLocationId)
                .OrderByDescending(l => l.ScanDate)
                .ToListAsync();
        }

        public async Task<LocationScan> ScanLocationAsync(int shipmentId, int officeLocationId, int scannedByUserId, string scanType, string? notes = null)
        {
            var locationScan = new LocationScan
            {
                ShipmentID = shipmentId,
                OfficeLocationID = officeLocationId,
                ScannedByUserID = scannedByUserId,
                ScanType = scanType,
                Status = "Scanned",
                Notes = notes,
                ScanDate = DateTime.UtcNow
            };

            return await CreateLocationScanAsync(locationScan);
        }

        public async Task<bool> ValidateQRCodeAsync(string qrCode)
        {
            // Check if QR code exists in office locations
            var location = await _context.OfficeLocations
                .FirstOrDefaultAsync(l => l.QRCode == qrCode && l.IsActive);

            return location != null;
        }
    }
}


