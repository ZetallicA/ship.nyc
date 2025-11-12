using Xunit;
using InterShip.Core.Models;

namespace InterShip.Core.Tests.Models
{
    public class ShipmentTests
    {
        [Fact]
        public void Shipment_ShouldHaveRequiredProperties()
        {
            // Arrange
            var shipment = new Shipment();

            // Act & Assert
            Assert.NotNull(shipment.TrackingNumber);
            Assert.NotNull(shipment.RecipientName);
            Assert.NotNull(shipment.PackageType);
            Assert.NotNull(shipment.UrgencyLevel);
            Assert.NotNull(shipment.Status);
            Assert.True(shipment.ShipmentID >= 0);
            Assert.True(shipment.FromLocationID >= 0);
            Assert.True(shipment.ToLocationID >= 0);
            Assert.True(shipment.SenderID >= 0);
        }

        [Fact]
        public void Shipment_ShouldInitializeWithDefaultValues()
        {
            // Arrange
            var shipment = new Shipment();

            // Act & Assert
            Assert.Equal("Normal", shipment.UrgencyLevel);
            Assert.Equal("Created", shipment.Status);
            Assert.NotNull(shipment.Events);
        }

        [Fact]
        public void Shipment_ShouldSetPropertiesCorrectly()
        {
            // Arrange
            var shipment = new Shipment
            {
                ShipmentID = 1,
                TrackingNumber = "ISH20240101001",
                FromLocationID = 1,
                ToLocationID = 2,
                SenderID = 1,
                RecipientName = "John Doe",
                PackageType = "Document",
                Notes = "Fragile",
                UrgencyLevel = "Urgent",
                Status = "Created"
            };

            // Act & Assert
            Assert.Equal(1, shipment.ShipmentID);
            Assert.Equal("ISH20240101001", shipment.TrackingNumber);
            Assert.Equal(1, shipment.FromLocationID);
            Assert.Equal(2, shipment.ToLocationID);
            Assert.Equal(1, shipment.SenderID);
            Assert.Equal("John Doe", shipment.RecipientName);
            Assert.Equal("Document", shipment.PackageType);
            Assert.Equal("Fragile", shipment.Notes);
            Assert.Equal("Urgent", shipment.UrgencyLevel);
            Assert.Equal("Created", shipment.Status);
        }
    }
}













