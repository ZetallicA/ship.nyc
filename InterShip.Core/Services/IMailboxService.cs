using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface IMailboxService
    {
        Task<IEnumerable<MailboxItem>> GetAllMailboxItemsAsync();
        Task<MailboxItem?> GetMailboxItemByIdAsync(int id);
        Task<MailboxItem> CreateMailboxItemAsync(MailboxItem mailboxItem);
        Task<MailboxItem> UpdateMailboxItemAsync(MailboxItem mailboxItem);
        Task<bool> DeleteMailboxItemAsync(int id);
        Task<IEnumerable<MailboxItem>> GetMailboxItemsByLocationAsync(int officeLocationId);
        Task<IEnumerable<MailboxItem>> GetMailboxItemsByUserAsync(int userId);
        Task<IEnumerable<MailboxItem>> GetExpectedItemsAsync(int officeLocationId);
        Task<IEnumerable<MailboxItem>> GetReceivedItemsAsync(int officeLocationId);
        Task<MailboxItem> MarkAsReceivedAsync(int mailboxItemId, DateTime receivedDate);
        Task<MailboxItem> MarkAsPickedUpAsync(int mailboxItemId, DateTime pickedUpDate);
    }
}


