using Xunit;
using InterShip.Core.Models;

namespace InterShip.Core.Tests.Models
{
    public class UserTests
    {
        [Fact]
        public void User_ShouldHaveRequiredProperties()
        {
            // Arrange
            var user = new User();

            // Act & Assert
            Assert.NotNull(user.Name);
            Assert.NotNull(user.Email);
            Assert.NotNull(user.Role);
            Assert.True(user.UserID >= 0);
            Assert.True(user.OfficeLocationID >= 0);
        }

        [Fact]
        public void User_ShouldInitializeCollections()
        {
            // Arrange
            var user = new User();

            // Act & Assert
            Assert.NotNull(user.SentShipments);
            Assert.NotNull(user.PerformedEvents);
        }

        [Fact]
        public void User_ShouldSetPropertiesCorrectly()
        {
            // Arrange
            var user = new User
            {
                UserID = 1,
                Name = "Test User",
                Email = "test@example.com",
                Role = "Sender",
                OfficeLocationID = 1
            };

            // Act & Assert
            Assert.Equal(1, user.UserID);
            Assert.Equal("Test User", user.Name);
            Assert.Equal("test@example.com", user.Email);
            Assert.Equal("Sender", user.Role);
            Assert.Equal(1, user.OfficeLocationID);
        }
    }
}






