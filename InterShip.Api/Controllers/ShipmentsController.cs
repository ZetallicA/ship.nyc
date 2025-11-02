using Microsoft.AspNetCore.Mvc;
using InterShip.Core.Models;
using InterShip.Core.Services;

namespace InterShip.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShipmentsController : ControllerBase
    {
        private readonly IShipmentService _shipmentService;
        private readonly ILogger<ShipmentsController> _logger;

        public ShipmentsController(IShipmentService shipmentService, ILogger<ShipmentsController> logger)
        {
            _shipmentService = shipmentService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipments()
        {
            try
            {
                var shipments = await _shipmentService.GetAllShipmentsAsync();
                return Ok(shipments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipments");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Shipment>> GetShipment(int id)
        {
            try
            {
                var shipment = await _shipmentService.GetShipmentByIdAsync(id);
                if (shipment == null)
                    return NotFound();

                return Ok(shipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipment {ShipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("track/{trackingNumber}")]
        public async Task<ActionResult<Shipment>> GetShipmentByTrackingNumber(string trackingNumber)
        {
            try
            {
                var shipment = await _shipmentService.GetShipmentByTrackingNumberAsync(trackingNumber);
                if (shipment == null)
                    return NotFound();

                return Ok(shipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipment by tracking number {TrackingNumber}", trackingNumber);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("sender/{senderId}")]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipmentsBySender(int senderId)
        {
            try
            {
                var shipments = await _shipmentService.GetShipmentsBySenderAsync(senderId);
                return Ok(shipments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipments by sender {SenderId}", senderId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipmentsByStatus(string status)
        {
            try
            {
                var shipments = await _shipmentService.GetShipmentsByStatusAsync(status);
                return Ok(shipments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipments by status {Status}", status);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipmentsByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var shipments = await _shipmentService.GetShipmentsByDateRangeAsync(startDate, endDate);
                return Ok(shipments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipments by date range");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{shipmentId}/events")]
        public async Task<ActionResult<IEnumerable<ShipmentEvent>>> GetShipmentEvents(int shipmentId)
        {
            try
            {
                var events = await _shipmentService.GetShipmentEventsAsync(shipmentId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipment events for {ShipmentId}", shipmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Shipment>> CreateShipment([FromBody] InterShip.Api.Models.CreateShipmentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(kvp => kvp.Value != null && kvp.Value.Errors.Count > 0)
                        .Select(kvp => new { Field = kvp.Key, Errors = kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray() })
                        .ToArray();
                    _logger.LogWarning("Shipment create validation failed: {@Errors}", errors);
                    return BadRequest(ModelState);
                }

                var shipment = new Shipment
                {
                    FromLocationID = request.FromLocationID,
                    ToLocationID = request.ToLocationID,
                    SenderID = request.SenderID,
                    RecipientName = request.RecipientName,
                    PackageType = request.PackageType,
                    Notes = request.Notes,
                    UrgencyLevel = request.UrgencyLevel,
                    Status = "Created",
                    CreatedDate = DateTime.UtcNow
                };

                var createdShipment = await _shipmentService.CreateShipmentAsync(shipment);
                return CreatedAtAction(nameof(GetShipment), new { id = createdShipment.ShipmentID }, createdShipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Shipment>> UpdateShipment(int id, Shipment shipment)
        {
            try
            {
                if (id != shipment.ShipmentID)
                    return BadRequest();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedShipment = await _shipmentService.UpdateShipmentAsync(shipment);
                return Ok(updatedShipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipment {ShipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{shipmentId}/events")]
        public async Task<ActionResult<ShipmentEvent>> AddShipmentEvent(int shipmentId, ShipmentEvent shipmentEvent)
        {
            try
            {
                if (shipmentId != shipmentEvent.ShipmentID)
                    return BadRequest();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var createdEvent = await _shipmentService.AddShipmentEventAsync(shipmentEvent);
                return CreatedAtAction(nameof(GetShipmentEvents), new { shipmentId = createdEvent.ShipmentID }, createdEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding shipment event for {ShipmentId}", shipmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteShipment(int id)
        {
            try
            {
                var result = await _shipmentService.DeleteShipmentAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shipment {ShipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}

