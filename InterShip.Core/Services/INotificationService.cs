using InterShip.Core.Models;

namespace InterShip.Core.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetAllNotificationsAsync();
        Task<Notification?> GetNotificationByIdAsync(int id);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task<Notification> UpdateNotificationAsync(Notification notification);
        Task<bool> DeleteNotificationAsync(int id);
        Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId);
        Task<IEnumerable<Notification>> GetUnreadNotificationsByUserAsync(int userId);
        Task<Notification> MarkAsReadAsync(int notificationId);
        Task<bool> SendNotificationAsync(Notification notification);
        Task<bool> SendBulkNotificationsAsync(IEnumerable<Notification> notifications);
    }
}


