namespace InterShip.Api.Models
{
    public class CreateShipmentRequest
    {
        public int FromLocationID { get; set; }
        public int ToLocationID { get; set; }
        public int SenderID { get; set; }
        public string RecipientName { get; set; } = string.Empty;
        public string PackageType { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string UrgencyLevel { get; set; } = "Normal";
    }
}







