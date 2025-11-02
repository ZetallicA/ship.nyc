using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class Shipment
    {
        [Key]
        public int ShipmentID { get; set; }

        [StringLength(50)]
        public string TrackingNumber { get; set; } = string.Empty;

        [ForeignKey("FromLocation")]
        public int FromLocationID { get; set; }

        [ForeignKey("ToLocation")]
        public int ToLocationID { get; set; }

        [ForeignKey("Sender")]
        public int SenderID { get; set; }

        [Required]
        [StringLength(100)]
        public string RecipientName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PackageType { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Notes { get; set; }

        [Required]
        [StringLength(20)]
        public string UrgencyLevel { get; set; } = "Normal"; // Normal, Urgent

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Created"; // Created, Picked Up, In Transit, Delivered

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual OfficeLocation FromLocation { get; set; } = null!;
        public virtual OfficeLocation ToLocation { get; set; } = null!;
        public virtual User Sender { get; set; } = null!;
        public virtual ICollection<ShipmentEvent> Events { get; set; } = new List<ShipmentEvent>();
    }
}

