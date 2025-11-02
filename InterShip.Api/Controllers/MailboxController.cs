using Microsoft.AspNetCore.Mvc;
using InterShip.Core.Models;
using InterShip.Core.Services;

namespace InterShip.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MailboxController : ControllerBase
    {
        private readonly IMailboxService _mailboxService;
        private readonly ILogger<MailboxController> _logger;

        public MailboxController(IMailboxService mailboxService, ILogger<MailboxController> logger)
        {
            _mailboxService = mailboxService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MailboxItem>>> GetMailboxItems()
        {
            try
            {
                var mailboxItems = await _mailboxService.GetAllMailboxItemsAsync();
                return Ok(mailboxItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mailbox items");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MailboxItem>> GetMailboxItem(int id)
        {
            try
            {
                var mailboxItem = await _mailboxService.GetMailboxItemByIdAsync(id);
                if (mailboxItem == null)
                    return NotFound();

                return Ok(mailboxItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mailbox item {MailboxItemId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("location/{officeLocationId}")]
        public async Task<ActionResult<IEnumerable<MailboxItem>>> GetMailboxItemsByLocation(int officeLocationId)
        {
            try
            {
                var mailboxItems = await _mailboxService.GetMailboxItemsByLocationAsync(officeLocationId);
                return Ok(mailboxItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mailbox items for location {OfficeLocationId}", officeLocationId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<MailboxItem>>> GetMailboxItemsByUser(int userId)
        {
            try
            {
                var mailboxItems = await _mailboxService.GetMailboxItemsByUserAsync(userId);
                return Ok(mailboxItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mailbox items for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("location/{officeLocationId}/expected")]
        public async Task<ActionResult<IEnumerable<MailboxItem>>> GetExpectedItems(int officeLocationId)
        {
            try
            {
                var expectedItems = await _mailboxService.GetExpectedItemsAsync(officeLocationId);
                return Ok(expectedItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expected items for location {OfficeLocationId}", officeLocationId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("location/{officeLocationId}/received")]
        public async Task<ActionResult<IEnumerable<MailboxItem>>> GetReceivedItems(int officeLocationId)
        {
            try
            {
                var receivedItems = await _mailboxService.GetReceivedItemsAsync(officeLocationId);
                return Ok(receivedItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving received items for location {OfficeLocationId}", officeLocationId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<MailboxItem>> CreateMailboxItem(MailboxItem mailboxItem)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var createdMailboxItem = await _mailboxService.CreateMailboxItemAsync(mailboxItem);
                return CreatedAtAction(nameof(GetMailboxItem), new { id = createdMailboxItem.MailboxItemID }, createdMailboxItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating mailbox item");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MailboxItem>> UpdateMailboxItem(int id, MailboxItem mailboxItem)
        {
            try
            {
                if (id != mailboxItem.MailboxItemID)
                    return BadRequest();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedMailboxItem = await _mailboxService.UpdateMailboxItemAsync(mailboxItem);
                return Ok(updatedMailboxItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating mailbox item {MailboxItemId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}/mark-received")]
        public async Task<ActionResult<MailboxItem>> MarkAsReceived(int id, [FromBody] DateTime receivedDate)
        {
            try
            {
                var mailboxItem = await _mailboxService.MarkAsReceivedAsync(id, receivedDate);
                if (mailboxItem == null)
                    return NotFound();

                return Ok(mailboxItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking mailbox item as received {MailboxItemId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}/mark-picked-up")]
        public async Task<ActionResult<MailboxItem>> MarkAsPickedUp(int id, [FromBody] DateTime pickedUpDate)
        {
            try
            {
                var mailboxItem = await _mailboxService.MarkAsPickedUpAsync(id, pickedUpDate);
                if (mailboxItem == null)
                    return NotFound();

                return Ok(mailboxItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking mailbox item as picked up {MailboxItemId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMailboxItem(int id)
        {
            try
            {
                var result = await _mailboxService.DeleteMailboxItemAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting mailbox item {MailboxItemId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}


