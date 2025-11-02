using Microsoft.EntityFrameworkCore;
using InterShip.Core.Models;

namespace InterShip.Infrastructure.Data
{
    public class InterShipDbContext : DbContext
    {
        public InterShipDbContext(DbContextOptions<InterShipDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<OfficeLocation> OfficeLocations { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        public DbSet<ShipmentEvent> ShipmentEvents { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<MailboxItem> MailboxItems { get; set; }
        public DbSet<LocationScan> LocationScans { get; set; }
        public DbSet<AuthUser> AuthUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserID);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.Email).IsUnique();
                
                entity.HasOne(d => d.OfficeLocation)
                    .WithMany(p => p.Users)
                    .HasForeignKey(d => d.OfficeLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure OfficeLocation entity
            modelBuilder.Entity<OfficeLocation>(entity =>
            {
                entity.HasKey(e => e.OfficeLocationID);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(200);
            });

            // Configure Shipment entity
            modelBuilder.Entity<Shipment>(entity =>
            {
                entity.HasKey(e => e.ShipmentID);
                entity.Property(e => e.TrackingNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.RecipientName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PackageType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.UrgencyLevel).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.TrackingNumber).IsUnique();
                
                entity.HasOne(d => d.FromLocation)
                    .WithMany(p => p.FromShipments)
                    .HasForeignKey(d => d.FromLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.ToLocation)
                    .WithMany(p => p.ToShipments)
                    .HasForeignKey(d => d.ToLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.Sender)
                    .WithMany(p => p.SentShipments)
                    .HasForeignKey(d => d.SenderID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure ShipmentEvent entity
            modelBuilder.Entity<ShipmentEvent>(entity =>
            {
                entity.HasKey(e => e.EventID);
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.PhotoURL).HasMaxLength(200);
                
                entity.HasOne(d => d.Shipment)
                    .WithMany(p => p.Events)
                    .HasForeignKey(d => d.ShipmentID)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(d => d.PerformedByUser)
                    .WithMany(p => p.PerformedEvents)
                    .HasForeignKey(d => d.PerformedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Department entity
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(e => e.DepartmentID);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(200);
                
                entity.HasOne(d => d.OfficeLocation)
                    .WithMany()
                    .HasForeignKey(d => d.OfficeLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Notification entity
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationID);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ExternalID).HasMaxLength(50);
                entity.Property(e => e.ErrorMessage).HasMaxLength(500);
                
                entity.HasOne(d => d.User)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure MailboxItem entity
            modelBuilder.Entity<MailboxItem>(entity =>
            {
                entity.HasKey(e => e.MailboxItemID);
                entity.Property(e => e.ItemType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.SenderName).HasMaxLength(100);
                entity.Property(e => e.RecipientName).HasMaxLength(100);
                entity.Property(e => e.TrackingNumber).HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(500);
                
                entity.HasOne(d => d.OfficeLocation)
                    .WithMany(p => p.MailboxItems)
                    .HasForeignKey(d => d.OfficeLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.User)
                    .WithMany(p => p.MailboxItems)
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.SetNull);
                    
                entity.HasOne(d => d.Shipment)
                    .WithMany()
                    .HasForeignKey(d => d.ShipmentID)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure LocationScan entity
            modelBuilder.Entity<LocationScan>(entity =>
            {
                entity.HasKey(e => e.LocationScanID);
                entity.Property(e => e.ScanType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.PhotoURL).HasMaxLength(200);
                
                entity.HasOne(d => d.Shipment)
                    .WithMany()
                    .HasForeignKey(d => d.ShipmentID)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(d => d.OfficeLocation)
                    .WithMany()
                    .HasForeignKey(d => d.OfficeLocationID)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.ScannedByUser)
                    .WithMany()
                    .HasForeignKey(d => d.ScannedByUserID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure AuthUser entity
            modelBuilder.Entity<AuthUser>(entity =>
            {
                entity.HasKey(e => e.AuthUserID);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.RefreshToken).HasMaxLength(200);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Auth Users
            modelBuilder.Entity<AuthUser>().HasData(
                new AuthUser
                {
                    AuthUserID = 1,
                    Username = "admin",
                    Email = "admin@intership.com",
                    PasswordHash = "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=", // "admin123"
                    Role = "Admin",
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                }
            );

            // Seed Office Locations
            modelBuilder.Entity<OfficeLocation>().HasData(
                new OfficeLocation { OfficeLocationID = 1, Name = "Main Office", Address = "123 Main St, City, State 12345" },
                new OfficeLocation { OfficeLocationID = 2, Name = "Branch Office A", Address = "456 Oak Ave, City, State 12345" },
                new OfficeLocation { OfficeLocationID = 3, Name = "Branch Office B", Address = "789 Pine St, City, State 12345" }
            );

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { UserID = 1, Name = "Admin User", Email = "admin@company.com", Role = "Admin", OfficeLocationID = 1 },
                new User { UserID = 2, Name = "John Driver", Email = "john.driver@company.com", Role = "Driver", OfficeLocationID = 1 },
                new User { UserID = 3, Name = "Jane Sender", Email = "jane.sender@company.com", Role = "Sender", OfficeLocationID = 2 }
            );
        }
    }
}


