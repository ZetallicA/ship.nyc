using Microsoft.AspNetCore.Mvc;
using InterShip.Core.Models;
using InterShip.Core.Services;

namespace InterShip.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationScanController : ControllerBase
    {
        private readonly ILocationScanService _locationScanService;
        private readonly ILogger<LocationScanController> _logger;

        public LocationScanController(ILocationScanService locationScanService, ILogger<LocationScanController> logger)
        {
            _locationScanService = locationScanService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LocationScan>>> GetLocationScans()
        {
            try
            {
                var locationScans = await _locationScanService.GetAllLocationScansAsync();
                return Ok(locationScans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving location scans");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LocationScan>> GetLocationScan(int id)
        {
            try
            {
                var locationScan = await _locationScanService.GetLocationScanByIdAsync(id);
                if (locationScan == null)
                    return NotFound();

                return Ok(locationScan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving location scan {LocationScanId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("shipment/{shipmentId}")]
        public async Task<ActionResult<IEnumerable<LocationScan>>> GetLocationScansByShipment(int shipmentId)
        {
            try
            {
                var locationScans = await _locationScanService.GetLocationScansByShipmentAsync(shipmentId);
                return Ok(locationScans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving location scans for shipment {ShipmentId}", shipmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("location/{officeLocationId}")]
        public async Task<ActionResult<IEnumerable<LocationScan>>> GetLocationScansByLocation(int officeLocationId)
        {
            try
            {
                var locationScans = await _locationScanService.GetLocationScansByLocationAsync(officeLocationId);
                return Ok(locationScans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving location scans for location {OfficeLocationId}", officeLocationId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("scan")]
        public async Task<ActionResult<LocationScan>> ScanLocation([FromBody] ScanLocationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var locationScan = await _locationScanService.ScanLocationAsync(
                    request.ShipmentId, 
                    request.OfficeLocationId, 
                    request.ScannedByUserId, 
                    request.ScanType, 
                    request.Notes);

                return Ok(locationScan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning location");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("validate-qr")]
        public async Task<ActionResult<bool>> ValidateQRCode([FromBody] string qrCode)
        {
            try
            {
                var isValid = await _locationScanService.ValidateQRCodeAsync(qrCode);
                return Ok(isValid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating QR code");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<LocationScan>> CreateLocationScan(LocationScan locationScan)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var createdLocationScan = await _locationScanService.CreateLocationScanAsync(locationScan);
                return CreatedAtAction(nameof(GetLocationScan), new { id = createdLocationScan.LocationScanID }, createdLocationScan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating location scan");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<LocationScan>> UpdateLocationScan(int id, LocationScan locationScan)
        {
            try
            {
                if (id != locationScan.LocationScanID)
                    return BadRequest();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedLocationScan = await _locationScanService.UpdateLocationScanAsync(locationScan);
                return Ok(updatedLocationScan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating location scan {LocationScanId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteLocationScan(int id)
        {
            try
            {
                var result = await _locationScanService.DeleteLocationScanAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting location scan {LocationScanId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class ScanLocationRequest
    {
        public int ShipmentId { get; set; }
        public int OfficeLocationId { get; set; }
        public int ScannedByUserId { get; set; }
        public string ScanType { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}


