using System.ComponentModel.DataAnnotations;

namespace InterShip.Core.Models
{
    public class OfficeLocation
    {
        [Key]
        public int OfficeLocationID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Address { get; set; } = string.Empty;

        [StringLength(50)]
        public string? QRCode { get; set; } // QR code identifier for scanning

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Shipment> FromShipments { get; set; } = new List<Shipment>();
        public virtual ICollection<Shipment> ToShipments { get; set; } = new List<Shipment>();
        public virtual ICollection<MailboxItem> MailboxItems { get; set; } = new List<MailboxItem>();
    }
}

