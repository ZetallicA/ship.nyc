import React, { useState, useEffect } from 'react';
import { mailboxAPI, officeLocationAPI, userAPI } from '../services/api';

const Mailbox = () => {
  const [mailboxItems, setMailboxItems] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    itemType: 'Package',
    description: '',
    senderName: '',
    recipientName: '',
    expectedDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, locationsResponse, usersResponse] = await Promise.all([
        mailboxAPI.getAll(),
        officeLocationAPI.getAll(),
        userAPI.getAll()
      ]);
      
      setMailboxItems(itemsResponse.data);
      setOfficeLocations(locationsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error loading mailbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (locationId) => {
    setSelectedLocation(locationId);
    if (locationId) {
      loadLocationItems(locationId);
    } else {
      setMailboxItems([]);
    }
  };

  const loadLocationItems = async (locationId) => {
    try {
      const response = await mailboxAPI.getByLocation(locationId);
      setMailboxItems(response.data);
    } catch (error) {
      console.error('Error loading location items:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      const itemData = {
        ...newItem,
        officeLocationID: selectedLocation,
        status: 'Expected',
        expectedDate: new Date(newItem.expectedDate)
      };
      
      const response = await mailboxAPI.create(itemData);
      setMailboxItems([...mailboxItems, response.data]);
      setShowAddModal(false);
      setNewItem({
        itemType: 'Package',
        description: '',
        senderName: '',
        recipientName: '',
        expectedDate: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding mailbox item:', error);
    }
  };

  const handleMarkAsReceived = async (itemId) => {
    try {
      const receivedDate = new Date();
      await mailboxAPI.markAsReceived(itemId, receivedDate);
      loadLocationItems(selectedLocation);
    } catch (error) {
      console.error('Error marking item as received:', error);
    }
  };

  const handleMarkAsPickedUp = async (itemId) => {
    try {
      const pickedUpDate = new Date();
      await mailboxAPI.markAsPickedUp(itemId, pickedUpDate);
      loadLocationItems(selectedLocation);
    } catch (error) {
      console.error('Error marking item as picked up:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Expected': 'bg-yellow-100 text-yellow-800',
      'Received': 'bg-green-100 text-green-800',
      'PickedUp': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl text-gray-600">Loading mailbox...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Mailbox Management</h1>
        <p className="text-2xl text-gray-600">Track expected and received items</p>
      </div>

      {/* Location Selector */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Select Location</h3>
          {selectedLocation && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              ➕ Add Expected Item
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {officeLocations.map((location) => (
            <button
              key={location.officeLocationID}
              onClick={() => handleLocationChange(location.officeLocationID)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedLocation === location.officeLocationID
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold text-gray-900">{location.name}</h4>
              <p className="text-gray-600 text-sm">{location.address}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mailbox Items */}
      {selectedLocation && (
        <div className="card">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Mailbox Items ({mailboxItems.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mailboxItems.map((item) => (
              <div key={item.mailboxItemID} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{item.description}</h4>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-gray-600 text-sm mb-2">Type: {item.itemType}</p>
                {item.senderName && (
                  <p className="text-gray-500 text-xs">From: {item.senderName}</p>
                )}
                {item.recipientName && (
                  <p className="text-gray-500 text-xs">To: {item.recipientName}</p>
                )}
                <p className="text-gray-500 text-xs">
                  Expected: {new Date(item.expectedDate).toLocaleDateString()}
                </p>
                {item.receivedDate && (
                  <p className="text-gray-500 text-xs">
                    Received: {new Date(item.receivedDate).toLocaleDateString()}
                  </p>
                )}
                {item.pickedUpDate && (
                  <p className="text-gray-500 text-xs">
                    Picked Up: {new Date(item.pickedUpDate).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-3 flex space-x-2">
                  {item.status === 'Expected' && (
                    <button
                      onClick={() => handleMarkAsReceived(item.mailboxItemID)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Mark Received
                    </button>
                  )}
                  {item.status === 'Received' && (
                    <button
                      onClick={() => handleMarkAsPickedUp(item.mailboxItemID)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Mark Picked Up
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Expected Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Type</label>
                <select
                  value={newItem.itemType}
                  onChange={(e) => setNewItem({...newItem, itemType: e.target.value})}
                  className="input-field"
                >
                  <option value="Package">Package</option>
                  <option value="Mail">Mail</option>
                  <option value="Document">Document</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="input-field"
                  placeholder="Item description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sender Name</label>
                <input
                  type="text"
                  value={newItem.senderName}
                  onChange={(e) => setNewItem({...newItem, senderName: e.target.value})}
                  className="input-field"
                  placeholder="Sender name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Name</label>
                <input
                  type="text"
                  value={newItem.recipientName}
                  onChange={(e) => setNewItem({...newItem, recipientName: e.target.value})}
                  className="input-field"
                  placeholder="Recipient name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Date</label>
                <input
                  type="date"
                  value={newItem.expectedDate}
                  onChange={(e) => setNewItem({...newItem, expectedDate: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  className="input-field"
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="btn-primary"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mailbox;


