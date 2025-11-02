using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class MailboxItem
    {
        [Key]
        public int MailboxItemID { get; set; }

        [ForeignKey("OfficeLocation")]
        public int OfficeLocationID { get; set; }

        [ForeignKey("User")]
        public int? UserID { get; set; } // Nullable for expected items

        [ForeignKey("Shipment")]
        public int? ShipmentID { get; set; } // Nullable for expected items

        [Required]
        [StringLength(100)]
        public string ItemType { get; set; } = string.Empty; // Package, Mail, Document

        [Required]
        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Expected"; // Expected, Received, PickedUp

        [StringLength(100)]
        public string? SenderName { get; set; }

        [StringLength(100)]
        public string? RecipientName { get; set; }

        [StringLength(50)]
        public string? TrackingNumber { get; set; }

        public DateTime ExpectedDate { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public DateTime? PickedUpDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual OfficeLocation OfficeLocation { get; set; } = null!;
        public virtual User? User { get; set; }
        public virtual Shipment? Shipment { get; set; }
    }
}


