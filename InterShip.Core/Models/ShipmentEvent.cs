using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class ShipmentEvent
    {
        [Key]
        public int EventID { get; set; }

        [ForeignKey("Shipment")]
        public int ShipmentID { get; set; }

        [Required]
        [StringLength(20)]
        public string EventType { get; set; } = string.Empty; // PickedUp, InTransit, Delivered

        [ForeignKey("PerformedBy")]
        public int PerformedBy { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? PhotoURL { get; set; }

        // Navigation properties
        public virtual Shipment Shipment { get; set; } = null!;
        public virtual User PerformedByUser { get; set; } = null!;
    }
}












