using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class ShipmentService : IShipmentService
    {
        private readonly InterShipDbContext _context;

        public ShipmentService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Shipment>> GetAllShipmentsAsync()
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .ToListAsync();
        }

        public async Task<Shipment?> GetShipmentByIdAsync(int id)
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .FirstOrDefaultAsync(s => s.ShipmentID == id);
        }

        public async Task<Shipment?> GetShipmentByTrackingNumberAsync(string trackingNumber)
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);
        }

        public async Task<Shipment> CreateShipmentAsync(Shipment shipment)
        {
            shipment.TrackingNumber = await GenerateTrackingNumberAsync();
            _context.Shipments.Add(shipment);
            await _context.SaveChangesAsync();
            
            // Add initial "Created" event to tracking history
            var createdEvent = new ShipmentEvent
            {
                ShipmentID = shipment.ShipmentID,
                EventType = "Created",
                Notes = "Shipment created and label generated",
                PerformedBy = shipment.SenderID,
                Timestamp = DateTime.UtcNow
            };
            _context.ShipmentEvents.Add(createdEvent);
            
            // Add "Waiting for Pick Up" event
            var waitingEvent = new ShipmentEvent
            {
                ShipmentID = shipment.ShipmentID,
                EventType = "Waiting for Pick Up",
                Notes = "Package is ready for pickup",
                PerformedBy = shipment.SenderID,
                Timestamp = DateTime.UtcNow.AddSeconds(1) // Slightly after created event
            };
            _context.ShipmentEvents.Add(waitingEvent);
            
            await _context.SaveChangesAsync();
            
            return shipment;
        }

        public async Task<Shipment> UpdateShipmentAsync(Shipment shipment)
        {
            _context.Shipments.Update(shipment);
            await _context.SaveChangesAsync();
            return shipment;
        }

        public async Task<bool> DeleteShipmentAsync(int id)
        {
            var shipment = await _context.Shipments.FindAsync(id);
            if (shipment == null)
                return false;

            _context.Shipments.Remove(shipment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Shipment>> GetShipmentsBySenderAsync(int senderId)
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .Where(s => s.SenderID == senderId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Shipment>> GetShipmentsByStatusAsync(string status)
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .Where(s => s.Status == status)
                .ToListAsync();
        }

        public async Task<IEnumerable<Shipment>> GetShipmentsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Shipments
                .Include(s => s.FromLocation)
                .Include(s => s.ToLocation)
                .Include(s => s.Sender)
                .Include(s => s.Events)
                .Where(s => s.CreatedDate >= startDate && s.CreatedDate <= endDate)
                .ToListAsync();
        }

        public async Task<ShipmentEvent> AddShipmentEventAsync(ShipmentEvent shipmentEvent)
        {
            _context.ShipmentEvents.Add(shipmentEvent);
            await _context.SaveChangesAsync();
            return shipmentEvent;
        }

        public async Task<IEnumerable<ShipmentEvent>> GetShipmentEventsAsync(int shipmentId)
        {
            return await _context.ShipmentEvents
                .Include(e => e.PerformedByUser)
                .Where(e => e.ShipmentID == shipmentId)
                .OrderBy(e => e.Timestamp)
                .ToListAsync();
        }

        public async Task<string> GenerateTrackingNumberAsync()
        {
            string trackingNumber;
            bool isUnique = false;
            
            do
            {
                trackingNumber = $"ISH{DateTime.UtcNow:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";
                isUnique = !await _context.Shipments.AnyAsync(s => s.TrackingNumber == trackingNumber);
            } while (!isUnique);

            return trackingNumber;
        }
    }
}

