using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;
using InterShip.Core.Services;
using InterShip.Infrastructure.Data;

namespace InterShip.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly InterShipDbContext _context;

        public NotificationService(InterShipDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Notification>> GetAllNotificationsAsync()
        {
            return await _context.Notifications
                .Include(n => n.User)
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();
        }

        public async Task<Notification?> GetNotificationByIdAsync(int id)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.NotificationID == id);
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            notification.CreatedDate = DateTime.UtcNow;
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<Notification> UpdateNotificationAsync(Notification notification)
        {
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<bool> DeleteNotificationAsync(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .Where(n => n.UserID == userId)
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsByUserAsync(int userId)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .Where(n => n.UserID == userId && n.Status != "Read")
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();
        }

        public async Task<Notification> MarkAsReadAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                notification.Status = "Read";
                notification.ReadDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return notification!;
        }

        public async Task<bool> SendNotificationAsync(Notification notification)
        {
            try
            {
                // Create the notification record
                await CreateNotificationAsync(notification);

                // Here you would integrate with actual notification services
                // For now, we'll simulate sending
                notification.Status = "Sent";
                notification.SentDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return true;
            }
            catch
            {
                notification.Status = "Failed";
                await _context.SaveChangesAsync();
                return false;
            }
        }

        public async Task<bool> SendBulkNotificationsAsync(IEnumerable<Notification> notifications)
        {
            try
            {
                foreach (var notification in notifications)
                {
                    await CreateNotificationAsync(notification);
                }

                // Mark all as sent
                foreach (var notification in notifications)
                {
                    notification.Status = "Sent";
                    notification.SentDate = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();

                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}


