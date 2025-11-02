using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class MailboxService : IMailboxService
    {
        private readonly InterShipDbContext _context;

        public MailboxService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MailboxItem>> GetAllMailboxItemsAsync()
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .OrderByDescending(m => m.CreatedDate)
                .ToListAsync();
        }

        public async Task<MailboxItem?> GetMailboxItemByIdAsync(int id)
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .FirstOrDefaultAsync(m => m.MailboxItemID == id);
        }

        public async Task<MailboxItem> CreateMailboxItemAsync(MailboxItem mailboxItem)
        {
            mailboxItem.CreatedDate = DateTime.UtcNow;
            _context.MailboxItems.Add(mailboxItem);
            await _context.SaveChangesAsync();
            return mailboxItem;
        }

        public async Task<MailboxItem> UpdateMailboxItemAsync(MailboxItem mailboxItem)
        {
            _context.MailboxItems.Update(mailboxItem);
            await _context.SaveChangesAsync();
            return mailboxItem;
        }

        public async Task<bool> DeleteMailboxItemAsync(int id)
        {
            var mailboxItem = await _context.MailboxItems.FindAsync(id);
            if (mailboxItem == null)
                return false;

            _context.MailboxItems.Remove(mailboxItem);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MailboxItem>> GetMailboxItemsByLocationAsync(int officeLocationId)
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .Where(m => m.OfficeLocationID == officeLocationId)
                .OrderByDescending(m => m.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MailboxItem>> GetMailboxItemsByUserAsync(int userId)
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .Where(m => m.UserID == userId)
                .OrderByDescending(m => m.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MailboxItem>> GetExpectedItemsAsync(int officeLocationId)
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .Where(m => m.OfficeLocationID == officeLocationId && m.Status == "Expected")
                .OrderBy(m => m.ExpectedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MailboxItem>> GetReceivedItemsAsync(int officeLocationId)
        {
            return await _context.MailboxItems
                .Include(m => m.OfficeLocation)
                .Include(m => m.User)
                .Include(m => m.Shipment)
                .Where(m => m.OfficeLocationID == officeLocationId && m.Status == "Received")
                .OrderByDescending(m => m.ReceivedDate)
                .ToListAsync();
        }

        public async Task<MailboxItem> MarkAsReceivedAsync(int mailboxItemId, DateTime receivedDate)
        {
            var mailboxItem = await _context.MailboxItems.FindAsync(mailboxItemId);
            if (mailboxItem != null)
            {
                mailboxItem.Status = "Received";
                mailboxItem.ReceivedDate = receivedDate;
                await _context.SaveChangesAsync();
            }
            return mailboxItem!;
        }

        public async Task<MailboxItem> MarkAsPickedUpAsync(int mailboxItemId, DateTime pickedUpDate)
        {
            var mailboxItem = await _context.MailboxItems.FindAsync(mailboxItemId);
            if (mailboxItem != null)
            {
                mailboxItem.Status = "PickedUp";
                mailboxItem.PickedUpDate = pickedUpDate;
                await _context.SaveChangesAsync();
            }
            return mailboxItem!;
        }
    }
}


