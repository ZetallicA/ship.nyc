import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Username must contain only letters, numbers, underscores, and hyphens').min(2).max(50),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['Sender', 'Driver', 'Supervisor', 'Admin']).default('Sender'),
  email: z.string().email().optional().nullable(),
})

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const loginPinSchema = z.object({
  id_number: z.string().min(1, 'ID number is required'),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
})

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
})

export const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
})

export const officeSchema = z.object({
  name: z.string().min(1, 'Office name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
})

export const shipmentSchema = z.object({
  destination_office_id: z.string().uuid('Invalid office ID'),
  recipient_name: z.string().min(1, 'Recipient name is required').max(100),
  package_type: z.string().min(1, 'Package type is required').max(50),
  urgency: z.enum(['Normal', 'Urgent', 'Express']).default('Normal'),
  notes: z.string().max(500).optional().nullable(),
})

export const statusSchema = z.object({
  status: z.enum(['Created', 'PickedUp', 'InTransit', 'Delivered', 'Returned']),
})

export const userUpdateSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(2).max(50).optional(),
  email: z.string().email().optional().nullable(),
  full_name: z.string().min(1).max(100).optional(),
  role: z.enum(['Sender', 'Driver', 'Supervisor', 'Admin']).optional(),
  is_active: z.boolean().optional(),
  id_number: z.string().optional().nullable(),
})

export const nfcTagSchema = z.object({
  tag_id: z.string().min(1, 'Tag ID is required'),
  office_id: z.string().uuid('Invalid office ID'),
  location_name: z.string().min(1, 'Location name is required'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const nfcScanSchema = z.object({
  tag_id: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional().nullable(),
})

export const routeSchema = z.object({
  route_name: z.string().min(1, 'Route name is required'),
  shipment_tracking_numbers: z.array(z.string()).min(1, 'At least one shipment is required'),
  driver_id: z.string().uuid('Invalid driver ID'),
  route_date: z.string().datetime().or(z.string()),
})

export const notificationPrefsSchema = z.object({
  notify_on_nfc_scan: z.boolean().default(false),
  notify_on_delivery: z.boolean().default(true),
  notification_methods: z.array(z.string()).default(['email']),
  phone_number: z.string().optional().nullable(),
})

export const proofOfDeliverySchema = z.object({
  recipient_name: z.string().min(1),
  signature: z.string().min(1, 'Signature is required'),
  photo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional().nullable(),
})
