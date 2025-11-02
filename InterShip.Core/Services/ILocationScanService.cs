using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface ILocationScanService
    {
        Task<IEnumerable<LocationScan>> GetAllLocationScansAsync();
        Task<LocationScan?> GetLocationScanByIdAsync(int id);
        Task<LocationScan> CreateLocationScanAsync(LocationScan locationScan);
        Task<LocationScan> UpdateLocationScanAsync(LocationScan locationScan);
        Task<bool> DeleteLocationScanAsync(int id);
        Task<IEnumerable<LocationScan>> GetLocationScansByShipmentAsync(int shipmentId);
        Task<IEnumerable<LocationScan>> GetLocationScansByLocationAsync(int officeLocationId);
        Task<LocationScan> ScanLocationAsync(int shipmentId, int officeLocationId, int scannedByUserId, string scanType, string? notes = null);
        Task<bool> ValidateQRCodeAsync(string qrCode);
    }
}


