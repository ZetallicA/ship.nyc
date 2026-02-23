-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Sender', 'Driver', 'Supervisor', 'Admin');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('Created', 'PickedUp', 'InTransit', 'Delivered', 'Returned');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('Normal', 'Urgent', 'Express');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('Planned', 'InProgress', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Skipped');

-- CreateEnum
CREATE TYPE "RouteAssignmentStatus" AS ENUM ('Assigned', 'InProgress', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "pin_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Sender',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "id_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "destination_office_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "package_type" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'Normal',
    "notes" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'Created',
    "sender_id" TEXT NOT NULL,
    "nfc_scan_required" BOOLEAN NOT NULL DEFAULT false,
    "nfc_tag_id" TEXT,
    "assigned_route_id" TEXT,
    "route_stop_sequence" INTEGER,
    "last_updated" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfc_tags" (
    "id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfc_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfc_scans" (
    "id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "nfc_tag_record_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "scan_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,

    CONSTRAINT "nfc_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notify_on_nfc_scan" BOOLEAN NOT NULL DEFAULT false,
    "notify_on_delivery" BOOLEAN NOT NULL DEFAULT true,
    "notification_methods" TEXT[] DEFAULT ARRAY['email']::TEXT[],
    "phone_number" TEXT,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "assigned_driver_id" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "route_date" TIMESTAMP(3) NOT NULL,
    "status" "RouteStatus" NOT NULL DEFAULT 'Planned',
    "optimized_waypoints" JSONB,
    "estimated_duration" INTEGER,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "stop_sequence" INTEGER NOT NULL,
    "office_id" TEXT NOT NULL,
    "nfc_tag_id" TEXT,
    "shipment_tracking_numbers" TEXT[],
    "estimated_arrival" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "stop_status" "StopStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_assignments" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RouteAssignmentStatus" NOT NULL DEFAULT 'Assigned',

    CONSTRAINT "route_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_of_delivery" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "delivery_signature" TEXT NOT NULL,
    "delivery_photo" TEXT,
    "delivery_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_lat" DOUBLE PRECISION,
    "delivery_lng" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_number_key" ON "users"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_sender_id_idx" ON "shipments"("sender_id");

-- CreateIndex
CREATE INDEX "shipments_destination_office_id_idx" ON "shipments"("destination_office_id");

-- CreateIndex
CREATE INDEX "shipment_events_tracking_number_idx" ON "shipment_events"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "nfc_tags_tag_id_key" ON "nfc_tags"("tag_id");

-- CreateIndex
CREATE INDEX "nfc_scans_tag_id_driver_id_scan_timestamp_idx" ON "nfc_scans"("tag_id", "driver_id", "scan_timestamp");

-- CreateIndex
CREATE INDEX "nfc_scans_expires_at_idx" ON "nfc_scans"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "routes_assigned_driver_id_idx" ON "routes"("assigned_driver_id");

-- CreateIndex
CREATE INDEX "routes_status_idx" ON "routes"("status");

-- CreateIndex
CREATE INDEX "route_stops_route_id_stop_sequence_idx" ON "route_stops"("route_id", "stop_sequence");

-- CreateIndex
CREATE UNIQUE INDEX "proof_of_delivery_tracking_number_key" ON "proof_of_delivery"("tracking_number");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destination_office_id_fkey" FOREIGN KEY ("destination_office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_nfc_tag_id_fkey" FOREIGN KEY ("nfc_tag_id") REFERENCES "nfc_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assigned_route_id_fkey" FOREIGN KEY ("assigned_route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_tracking_number_fkey" FOREIGN KEY ("tracking_number") REFERENCES "shipments"("tracking_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfc_scans" ADD CONSTRAINT "nfc_scans_nfc_tag_record_id_fkey" FOREIGN KEY ("nfc_tag_record_id") REFERENCES "nfc_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfc_scans" ADD CONSTRAINT "nfc_scans_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_nfc_tag_id_fkey" FOREIGN KEY ("nfc_tag_id") REFERENCES "nfc_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_tracking_number_fkey" FOREIGN KEY ("tracking_number") REFERENCES "shipments"("tracking_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
