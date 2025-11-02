using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InterShip.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuthUsers",
                columns: table => new
                {
                    AuthUserID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RefreshToken = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    RefreshTokenExpiry = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthUsers", x => x.AuthUserID);
                });

            migrationBuilder.CreateTable(
                name: "OfficeLocations",
                columns: table => new
                {
                    OfficeLocationID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    QRCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    ContactPerson = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfficeLocations", x => x.OfficeLocationID);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    DepartmentID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    OfficeLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.DepartmentID);
                    table.ForeignKey(
                        name: "FK_Departments_OfficeLocations_OfficeLocationID",
                        column: x => x.OfficeLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    OfficeLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    DepartmentID = table.Column<int>(type: "INTEGER", nullable: true),
                    EmployeeID = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentID",
                        column: x => x.DepartmentID,
                        principalTable: "Departments",
                        principalColumn: "DepartmentID");
                    table.ForeignKey(
                        name: "FK_Users_OfficeLocations_OfficeLocationID",
                        column: x => x.OfficeLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserID = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ExternalID = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SentDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReadDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ErrorMessage = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationID);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    ShipmentID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TrackingNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FromLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    ToLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    SenderID = table.Column<int>(type: "INTEGER", nullable: false),
                    RecipientName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PackageType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    UrgencyLevel = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.ShipmentID);
                    table.ForeignKey(
                        name: "FK_Shipments_OfficeLocations_FromLocationID",
                        column: x => x.FromLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shipments_OfficeLocations_ToLocationID",
                        column: x => x.ToLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shipments_Users_SenderID",
                        column: x => x.SenderID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LocationScans",
                columns: table => new
                {
                    LocationScanID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ShipmentID = table.Column<int>(type: "INTEGER", nullable: false),
                    OfficeLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    ScannedByUserID = table.Column<int>(type: "INTEGER", nullable: false),
                    ScanType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ScanDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    PhotoURL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationScans", x => x.LocationScanID);
                    table.ForeignKey(
                        name: "FK_LocationScans_OfficeLocations_OfficeLocationID",
                        column: x => x.OfficeLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LocationScans_Shipments_ShipmentID",
                        column: x => x.ShipmentID,
                        principalTable: "Shipments",
                        principalColumn: "ShipmentID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocationScans_Users_ScannedByUserID",
                        column: x => x.ScannedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MailboxItems",
                columns: table => new
                {
                    MailboxItemID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OfficeLocationID = table.Column<int>(type: "INTEGER", nullable: false),
                    UserID = table.Column<int>(type: "INTEGER", nullable: true),
                    ShipmentID = table.Column<int>(type: "INTEGER", nullable: true),
                    ItemType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SenderName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    RecipientName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    TrackingNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    ExpectedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReceivedDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PickedUpDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MailboxItems", x => x.MailboxItemID);
                    table.ForeignKey(
                        name: "FK_MailboxItems_OfficeLocations_OfficeLocationID",
                        column: x => x.OfficeLocationID,
                        principalTable: "OfficeLocations",
                        principalColumn: "OfficeLocationID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MailboxItems_Shipments_ShipmentID",
                        column: x => x.ShipmentID,
                        principalTable: "Shipments",
                        principalColumn: "ShipmentID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MailboxItems_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ShipmentEvents",
                columns: table => new
                {
                    EventID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ShipmentID = table.Column<int>(type: "INTEGER", nullable: false),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    PerformedBy = table.Column<int>(type: "INTEGER", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    PhotoURL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentEvents", x => x.EventID);
                    table.ForeignKey(
                        name: "FK_ShipmentEvents_Shipments_ShipmentID",
                        column: x => x.ShipmentID,
                        principalTable: "Shipments",
                        principalColumn: "ShipmentID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShipmentEvents_Users_PerformedBy",
                        column: x => x.PerformedBy,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AuthUsers",
                columns: new[] { "AuthUserID", "CreatedDate", "Email", "IsActive", "LastLoginDate", "PasswordHash", "RefreshToken", "RefreshTokenExpiry", "Role", "Username" },
                values: new object[] { 1, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(7809), "admin@intership.com", true, null, "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=", null, null, "Admin", "admin" });

            migrationBuilder.InsertData(
                table: "OfficeLocations",
                columns: new[] { "OfficeLocationID", "Address", "ContactPerson", "CreatedDate", "IsActive", "Name", "PhoneNumber", "QRCode" },
                values: new object[,]
                {
                    { 1, "123 Main St, City, State 12345", null, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(7990), true, "Main Office", null, null },
                    { 2, "456 Oak Ave, City, State 12345", null, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(8001), true, "Branch Office A", null, null },
                    { 3, "789 Pine St, City, State 12345", null, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(8003), true, "Branch Office B", null, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserID", "CreatedDate", "DepartmentID", "Email", "EmployeeID", "IsActive", "LastLoginDate", "Name", "OfficeLocationID", "PasswordHash", "PhoneNumber", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(8032), null, "admin@company.com", null, true, null, "Admin User", 1, null, null, "Admin" },
                    { 2, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(8038), null, "john.driver@company.com", null, true, null, "John Driver", 1, null, null, "Driver" },
                    { 3, new DateTime(2025, 10, 11, 23, 31, 31, 173, DateTimeKind.Utc).AddTicks(8041), null, "jane.sender@company.com", null, true, null, "Jane Sender", 2, null, null, "Sender" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuthUsers_Email",
                table: "AuthUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuthUsers_Username",
                table: "AuthUsers",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_OfficeLocationID",
                table: "Departments",
                column: "OfficeLocationID");

            migrationBuilder.CreateIndex(
                name: "IX_LocationScans_OfficeLocationID",
                table: "LocationScans",
                column: "OfficeLocationID");

            migrationBuilder.CreateIndex(
                name: "IX_LocationScans_ScannedByUserID",
                table: "LocationScans",
                column: "ScannedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_LocationScans_ShipmentID",
                table: "LocationScans",
                column: "ShipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_MailboxItems_OfficeLocationID",
                table: "MailboxItems",
                column: "OfficeLocationID");

            migrationBuilder.CreateIndex(
                name: "IX_MailboxItems_ShipmentID",
                table: "MailboxItems",
                column: "ShipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_MailboxItems_UserID",
                table: "MailboxItems",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserID",
                table: "Notifications",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentEvents_PerformedBy",
                table: "ShipmentEvents",
                column: "PerformedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentEvents_ShipmentID",
                table: "ShipmentEvents",
                column: "ShipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_FromLocationID",
                table: "Shipments",
                column: "FromLocationID");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_SenderID",
                table: "Shipments",
                column: "SenderID");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ToLocationID",
                table: "Shipments",
                column: "ToLocationID");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TrackingNumber",
                table: "Shipments",
                column: "TrackingNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentID",
                table: "Users",
                column: "DepartmentID");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_OfficeLocationID",
                table: "Users",
                column: "OfficeLocationID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthUsers");

            migrationBuilder.DropTable(
                name: "LocationScans");

            migrationBuilder.DropTable(
                name: "MailboxItems");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "ShipmentEvents");

            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "OfficeLocations");
        }
    }
}
