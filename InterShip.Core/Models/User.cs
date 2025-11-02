using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = string.Empty; // Sender, Driver, Admin

        [ForeignKey("OfficeLocation")]
        public int OfficeLocationID { get; set; }

        [ForeignKey("Department")]
        public int? DepartmentID { get; set; }

        [StringLength(50)]
        public string? EmployeeID { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        public string? PasswordHash { get; set; } // For authentication

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginDate { get; set; }

        // Navigation properties
        public virtual OfficeLocation OfficeLocation { get; set; } = null!;
        public virtual Department? Department { get; set; }
        public virtual ICollection<Shipment> SentShipments { get; set; } = new List<Shipment>();
        public virtual ICollection<ShipmentEvent> PerformedEvents { get; set; } = new List<ShipmentEvent>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<MailboxItem> MailboxItems { get; set; } = new List<MailboxItem>();
    }
}

