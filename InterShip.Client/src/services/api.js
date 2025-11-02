import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mailbackend.oathone.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByEmail: (email) => api.get(`/users/email/${email}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getByOfficeLocation: (officeLocationId) => api.get(`/users/office/${officeLocationId}`),
  create: (user) => api.post('/users', user),
  update: (id, user) => api.put(`/users/${id}`, user),
  delete: (id) => api.delete(`/users/${id}`),
};

// Office Location API
export const officeLocationAPI = {
  getAll: () => api.get('/officelocations'),
  getById: (id) => api.get(`/officelocations/${id}`),
  create: (officeLocation) => api.post('/officelocations', officeLocation),
  update: (id, officeLocation) => api.put(`/officelocations/${id}`, officeLocation),
  delete: (id) => api.delete(`/officelocations/${id}`),
};

// Shipment API
export const shipmentAPI = {
  getAll: () => api.get('/shipments'),
  getById: (id) => api.get(`/shipments/${id}`),
  getByTrackingNumber: (trackingNumber) => api.get(`/shipments/track/${trackingNumber}`),
  getBySender: (senderId) => api.get(`/shipments/sender/${senderId}`),
  getByStatus: (status) => api.get(`/shipments/status/${status}`),
  getByDateRange: (startDate, endDate) => api.get(`/shipments/date-range?startDate=${startDate}&endDate=${endDate}`),
  getEvents: (shipmentId) => api.get(`/shipments/${shipmentId}/events`),
  create: (shipment) => api.post('/shipments', shipment),
  update: (id, shipment) => api.put(`/shipments/${id}`, shipment),
  addEvent: (shipmentId, event) => api.post(`/shipments/${shipmentId}/events`, event),
  delete: (id) => api.delete(`/shipments/${id}`),
};

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  getByOfficeLocation: (officeLocationId) => api.get(`/departments/office/${officeLocationId}`),
  create: (department) => api.post('/departments', department),
  update: (id, department) => api.put(`/departments/${id}`, department),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getById: (id) => api.get(`/notifications/${id}`),
  getByUser: (userId) => api.get(`/notifications/user/${userId}`),
  getUnreadByUser: (userId) => api.get(`/notifications/user/${userId}/unread`),
  create: (notification) => api.post('/notifications', notification),
  send: (notification) => api.post('/notifications/send', notification),
  sendBulk: (notifications) => api.post('/notifications/send-bulk', notifications),
  markAsRead: (id) => api.put(`/notifications/${id}/mark-read`),
  update: (id, notification) => api.put(`/notifications/${id}`, notification),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Mailbox API
export const mailboxAPI = {
  getAll: () => api.get('/mailbox'),
  getById: (id) => api.get(`/mailbox/${id}`),
  getByLocation: (officeLocationId) => api.get(`/mailbox/location/${officeLocationId}`),
  getByUser: (userId) => api.get(`/mailbox/user/${userId}`),
  getExpected: (officeLocationId) => api.get(`/mailbox/location/${officeLocationId}/expected`),
  getReceived: (officeLocationId) => api.get(`/mailbox/location/${officeLocationId}/received`),
  create: (mailboxItem) => api.post('/mailbox', mailboxItem),
  update: (id, mailboxItem) => api.put(`/mailbox/${id}`, mailboxItem),
  markAsReceived: (id, receivedDate) => api.put(`/mailbox/${id}/mark-received`, receivedDate),
  markAsPickedUp: (id, pickedUpDate) => api.put(`/mailbox/${id}/mark-picked-up`, pickedUpDate),
  delete: (id) => api.delete(`/mailbox/${id}`),
};

// Location Scan API
export const locationScanAPI = {
  getAll: () => api.get('/locationscan'),
  getById: (id) => api.get(`/locationscan/${id}`),
  getByShipment: (shipmentId) => api.get(`/locationscan/shipment/${shipmentId}`),
  getByLocation: (officeLocationId) => api.get(`/locationscan/location/${officeLocationId}`),
  scan: (scanRequest) => api.post('/locationscan/scan', scanRequest),
  validateQR: (qrCode) => api.post('/locationscan/validate-qr', qrCode),
  create: (locationScan) => api.post('/locationscan', locationScan),
  update: (id, locationScan) => api.put(`/locationscan/${id}`, locationScan),
  delete: (id) => api.delete(`/locationscan/${id}`),
};

export default api;

