using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class LocationScan
    {
        [Key]
        public int LocationScanID { get; set; }

        [ForeignKey("Shipment")]
        public int ShipmentID { get; set; }

        [ForeignKey("OfficeLocation")]
        public int OfficeLocationID { get; set; }

        [ForeignKey("User")]
        public int ScannedByUserID { get; set; }

        [Required]
        [StringLength(20)]
        public string ScanType { get; set; } = string.Empty; // Pickup, Delivery, Transit

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty; // Scanned, Confirmed, Rejected

        public DateTime ScanDate { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? PhotoURL { get; set; }

        // Navigation properties
        public virtual Shipment Shipment { get; set; } = null!;
        public virtual OfficeLocation OfficeLocation { get; set; } = null!;
        public virtual User ScannedByUser { get; set; } = null!;
    }
}


