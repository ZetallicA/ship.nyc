using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterShip.Core.Models
{
    public class Notification
    {
        [Key]
        public int NotificationID { get; set; }

        [ForeignKey("User")]
        public int UserID { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // Email, SMS, Push, InApp

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Sent, Failed, Read

        [StringLength(50)]
        public string? ExternalID { get; set; } // For tracking external service IDs

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? SentDate { get; set; }

        public DateTime? ReadDate { get; set; }

        [StringLength(500)]
        public string? ErrorMessage { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}


