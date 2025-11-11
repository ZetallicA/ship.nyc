using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface IShipmentService
    {
        Task<IEnumerable<Shipment>> GetAllShipmentsAsync();
        Task<Shipment?> GetShipmentByIdAsync(int id);
        Task<Shipment?> GetShipmentByTrackingNumberAsync(string trackingNumber);
        Task<Shipment> CreateShipmentAsync(Shipment shipment);
        Task<Shipment> UpdateShipmentAsync(Shipment shipment);
        Task<bool> DeleteShipmentAsync(int id);
        Task<IEnumerable<Shipment>> GetShipmentsBySenderAsync(int senderId);
        Task<IEnumerable<Shipment>> GetShipmentsByStatusAsync(string status);
        Task<IEnumerable<Shipment>> GetShipmentsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<ShipmentEvent> AddShipmentEventAsync(ShipmentEvent shipmentEvent);
        Task<IEnumerable<ShipmentEvent>> GetShipmentEventsAsync(int shipmentId);
        Task<string> GenerateTrackingNumberAsync();
    }
}












