export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: 'User' | 'Driver' | 'Supervisor' | 'Admin'
  is_active: boolean
  id_number?: string | null
}

export interface Office {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  lat?: number | null
  lng?: number | null
  is_active: boolean
  created_at: string
}

export interface Shipment {
  id: string
  tracking_number: string
  destination_office_id: string
  destination_office_name: string
  recipient_name: string
  recipient_email?: string | null
  recipient_phone?: string | null
  sender_id: string
  sender_name: string
  sender_email?: string | null
  description?: string | null
  weight_kg?: number | null
  urgency: 'Standard' | 'Express' | 'Overnight'
  status: 'Pending' | 'PickedUp' | 'InTransit' | 'OutForDelivery' | 'Delivered' | 'Failed' | 'Returned'
  estimated_delivery?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface ShipmentEvent {
  id: string
  tracking_number: string
  status: string
  notes?: string | null
  location?: string | null
  created_by: string
  created_by_name: string
  created_at: string
}

export interface NfcTag {
  id: string
  tag_id: string
  location_name: string
  office_id?: string | null
  lat?: number | null
  lng?: number | null
  is_active: boolean
  created_at: string
}

export interface Stats {
  total: number
  inTransit: number
  deliveredToday: number
  pendingPickup: number
}

export interface NotificationPrefs {
  emailEnabled: boolean
  smsEnabled: boolean
  notificationMethods: string[]
  statusUpdates: boolean
  deliveryAlerts: boolean
}
