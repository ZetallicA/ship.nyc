using Microsoft.AspNetCore.Mvc;
using InterShip.Core.Models;
using InterShip.Core.Services;

namespace InterShip.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OfficeLocationsController : ControllerBase
    {
        private readonly IOfficeLocationService _officeLocationService;
        private readonly ILogger<OfficeLocationsController> _logger;

        public OfficeLocationsController(IOfficeLocationService officeLocationService, ILogger<OfficeLocationsController> logger)
        {
            _officeLocationService = officeLocationService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OfficeLocation>>> GetOfficeLocations()
        {
            try
            {
                var officeLocations = await _officeLocationService.GetAllOfficeLocationsAsync();
                return Ok(officeLocations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving office locations");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OfficeLocation>> GetOfficeLocation(int id)
        {
            try
            {
                var officeLocation = await _officeLocationService.GetOfficeLocationByIdAsync(id);
                if (officeLocation == null)
                    return NotFound();

                return Ok(officeLocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving office location {OfficeLocationId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<OfficeLocation>> CreateOfficeLocation(OfficeLocation officeLocation)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var createdOfficeLocation = await _officeLocationService.CreateOfficeLocationAsync(officeLocation);
                return CreatedAtAction(nameof(GetOfficeLocation), new { id = createdOfficeLocation.OfficeLocationID }, createdOfficeLocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating office location");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<OfficeLocation>> UpdateOfficeLocation(int id, OfficeLocation officeLocation)
        {
            try
            {
                if (id != officeLocation.OfficeLocationID)
                    return BadRequest();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedOfficeLocation = await _officeLocationService.UpdateOfficeLocationAsync(officeLocation);
                return Ok(updatedOfficeLocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating office location {OfficeLocationId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteOfficeLocation(int id)
        {
            try
            {
                var result = await _officeLocationService.DeleteOfficeLocationAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting office location {OfficeLocationId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}













