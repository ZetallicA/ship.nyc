import React, { useState, useEffect } from 'react';
import { shipmentAPI, userAPI, officeLocationAPI, departmentAPI, notificationAPI, mailboxAPI } from '../services/api';
import QRCode from 'qrcode';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('shipments');
  const [shipments, setShipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mailboxItems, setMailboxItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    contactPerson: '',
    phoneNumber: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'User',
    officeLocationID: 1,
    employeeID: '',
    phoneNumber: ''
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    officeLocationID: 1
  });
  const [filters, setFilters] = useState({
    status: '',
    sender: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [shipmentsResponse, usersResponse, locationsResponse, departmentsResponse, notificationsResponse, mailboxResponse] = await Promise.all([
        shipmentAPI.getAll(),
        userAPI.getAll(),
        officeLocationAPI.getAll(),
        departmentAPI.getAll(),
        notificationAPI.getAll(),
        mailboxAPI.getAll(),
      ]);
      
      setShipments(shipmentsResponse.data);
      setUsers(usersResponse.data);
      setOfficeLocations(locationsResponse.data);
      setDepartments(departmentsResponse.data);
      setNotifications(notificationsResponse.data);
      setMailboxItems(mailboxResponse.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const getFilteredShipments = () => {
    let filtered = [...shipments];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.sender) {
      filtered = filtered.filter(s => s.senderID === parseInt(filters.sender));
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(s => new Date(s.createdDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(s => new Date(s.createdDate) <= new Date(filters.dateTo));
    }

    return filtered;
  };

  const exportToCSV = () => {
    const filteredShipments = getFilteredShipments();
    const csvContent = [
      ['Tracking Number', 'Recipient', 'From', 'To', 'Status', 'Created Date', 'Package Type', 'Urgency'],
      ...filteredShipments.map(shipment => [
        shipment.trackingNumber,
        shipment.recipientName,
        shipment.fromLocation?.name || '',
        shipment.toLocation?.name || '',
        shipment.status,
        new Date(shipment.createdDate).toLocaleDateString(),
        shipment.packageType,
        shipment.urgencyLevel,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Created': 'status-created',
      'Picked Up': 'status-pickedup',
      'In Transit': 'status-intransit',
      'Delivered': 'status-delivered',
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-created'}`}>
        {status}
      </span>
    );
  };

  const handleCreateLocation = async () => {
    try {
      const response = await officeLocationAPI.create(newLocation);
      setOfficeLocations([...officeLocations, response.data]);
      setShowLocationModal(false);
      setNewLocation({ name: '', address: '', contactPerson: '', phoneNumber: '' });
    } catch (error) {
      console.error('Error creating location:', error);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await officeLocationAPI.delete(locationId);
        setOfficeLocations(officeLocations.filter(loc => loc.officeLocationID !== locationId));
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  const generateQRCode = async (location) => {
    try {
      const qrData = `LOCATION:${location.officeLocationID}:${location.name}`;
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      setQrCodeData(qrCodeUrl);
      setSelectedLocation(location);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `qr-code-${selectedLocation?.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeData;
    link.click();
  };

  const handleCreateUser = async () => {
    try {
      const response = await userAPI.create(newUser);
      setUsers([...users, response.data]);
      setShowUserModal(false);
      setNewUser({ name: '', email: '', role: 'User', officeLocationID: 1, employeeID: '', phoneNumber: '' });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      const response = await departmentAPI.create(newDepartment);
      setDepartments([...departments, response.data]);
      setShowDepartmentModal(false);
      setNewDepartment({ name: '', description: '', officeLocationID: 1 });
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        setUsers(users.filter(user => user.userID !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const tabs = [
    { id: 'shipments', label: 'Shipments', icon: '📦' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'locations', label: 'Locations', icon: '🏢' },
    { id: 'departments', label: 'Departments', icon: '🏢' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'mailbox', label: 'Mailbox', icon: '📬' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Admin Panel</h1>
        <p className="text-2xl text-gray-600">Manage shipments, users, and generate reports</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Statuses</option>
                  <option value="Created">Created</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sender</label>
                <select
                  value={filters.sender}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Senders</option>
                  {users.map(user => (
                    <option key={user.userID} value={user.userID}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-lg text-gray-600">
                Showing {getFilteredShipments().length} of {shipments.length} shipments
              </div>
              <button
                onClick={exportToCSV}
                className="btn-primary"
              >
                📊 Export CSV
              </button>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tracking #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Recipient</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredShipments().map((shipment) => (
                    <tr key={shipment.shipmentID} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{shipment.trackingNumber}</td>
                      <td className="py-3 px-4">{shipment.recipientName}</td>
                      <td className="py-3 px-4">{shipment.fromLocation?.name}</td>
                      <td className="py-3 px-4">{shipment.toLocation?.name}</td>
                      <td className="py-3 px-4">{getStatusBadge(shipment.status)}</td>
                      <td className="py-3 px-4">{new Date(shipment.createdDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{shipment.packageType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Users ({users.length})</h3>
              <button
                onClick={() => setShowUserModal(true)}
                className="btn-primary"
              >
                ➕ Add User
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.userID} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                        {user.employeeID && (
                          <p className="text-xs text-gray-400">ID: {user.employeeID}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.userID)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Office Locations ({officeLocations.length})</h3>
              <button
                onClick={() => setShowLocationModal(true)}
                className="btn-primary"
              >
                ➕ Add Location
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officeLocations.map((location) => (
                <div key={location.officeLocationID} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{location.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => generateQRCode(location)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Generate QR Code"
                      >
                        📱
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.officeLocationID)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete Location"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{location.address}</p>
                  {location.contactPerson && (
                    <p className="text-gray-500 text-xs">Contact: {location.contactPerson}</p>
                  )}
                  {location.phoneNumber && (
                    <p className="text-gray-500 text-xs">Phone: {location.phoneNumber}</p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Departments ({departments.length})</h3>
              <button
                onClick={() => setShowDepartmentModal(true)}
                className="btn-primary"
              >
                ➕ Add Department
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <div key={department.departmentID} className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">{department.name}</h4>
                  <p className="text-gray-600 text-sm mb-2">{department.description}</p>
                  <p className="text-gray-500 text-xs">Location: {department.officeLocation?.name}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {department.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Notifications ({notifications.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr key={notification.notificationID} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{notification.user?.name}</td>
                      <td className="py-3 px-4">{notification.title}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.type === 'Email' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'SMS' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.status === 'Sent' ? 'bg-green-100 text-green-800' :
                          notification.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(notification.createdDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mailbox Tab */}
      {activeTab === 'mailbox' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Mailbox Items ({mailboxItems.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mailboxItems.map((item) => (
                <div key={item.mailboxItemID} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{item.description}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'Expected' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Received' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Type: {item.itemType}</p>
                  {item.senderName && (
                    <p className="text-gray-500 text-xs">From: {item.senderName}</p>
                  )}
                  {item.recipientName && (
                    <p className="text-gray-500 text-xs">To: {item.recipientName}</p>
                  )}
                  <p className="text-gray-500 text-xs">Location: {item.officeLocation?.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-4xl text-primary-600 mb-2">📦</div>
              <div className="text-3xl font-bold text-gray-900">{shipments.length}</div>
              <div className="text-lg text-gray-600">Total Shipments</div>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl text-success-600 mb-2">✅</div>
              <div className="text-3xl font-bold text-gray-900">
                {shipments.filter(s => s.status === 'Delivered').length}
              </div>
              <div className="text-lg text-gray-600">Delivered</div>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl text-yellow-600 mb-2">⏳</div>
              <div className="text-3xl font-bold text-gray-900">
                {shipments.filter(s => s.status !== 'Delivered').length}
              </div>
              <div className="text-lg text-gray-600">In Progress</div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={exportToCSV}
                className="btn-primary"
              >
                📊 Export All Shipments
              </button>
              <button
                onClick={() => window.print()}
                className="btn-secondary"
              >
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  className="input-field"
                  placeholder="Location name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                  className="input-field"
                  placeholder="Full address"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={newLocation.contactPerson}
                  onChange={(e) => setNewLocation({...newLocation, contactPerson: e.target.value})}
                  className="input-field"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={newLocation.phoneNumber}
                  onChange={(e) => setNewLocation({...newLocation, phoneNumber: e.target.value})}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLocation}
                className="btn-primary"
              >
                Create Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code for {selectedLocation.name}</h3>
            <div className="text-center">
              <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to identify this location for package handoffs.
              </p>
              <button
                onClick={downloadQRCode}
                className="btn-primary"
              >
                📥 Download QR Code
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input-field"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="input-field"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Office Location</label>
                <select
                  value={newUser.officeLocationID}
                  onChange={(e) => setNewUser({...newUser, officeLocationID: parseInt(e.target.value)})}
                  className="input-field"
                >
                  {officeLocations.map(location => (
                    <option key={location.officeLocationID} value={location.officeLocationID}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  value={newUser.employeeID}
                  onChange={(e) => setNewUser({...newUser, employeeID: e.target.value})}
                  className="input-field"
                  placeholder="Employee ID (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                  className="input-field"
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="btn-primary"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="input-field"
                  placeholder="Department name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  className="input-field"
                  placeholder="Department description"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Office Location</label>
                <select
                  value={newDepartment.officeLocationID}
                  onChange={(e) => setNewDepartment({...newDepartment, officeLocationID: parseInt(e.target.value)})}
                  className="input-field"
                >
                  {officeLocations.map(location => (
                    <option key={location.officeLocationID} value={location.officeLocationID}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDepartment}
                className="btn-primary"
              >
                Create Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;


