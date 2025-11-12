import React, { useState } from 'react';
import { shipmentAPI } from '../services/api';

const TrackPackage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await shipmentAPI.getByTrackingNumber(trackingNumber.trim());
      const shipmentData = response.data;
      
      setShipment(shipmentData);
      
      // Load events
      const eventsResponse = await shipmentAPI.getEvents(shipmentData.shipmentID);
      setEvents(eventsResponse.data);
    } catch (error) {
      console.error('Error tracking shipment:', error);
      setError('Shipment not found. Please check your tracking number.');
      setShipment(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Created': '📝',
      'Picked Up': '📦',
      'In Transit': '🚚',
      'Delivered': '✅',
    };
    return icons[status] || '📦';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Created': 'text-blue-600',
      'Picked Up': 'text-yellow-600',
      'In Transit': 'text-purple-600',
      'Delivered': 'text-green-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'PickedUp': '📦',
      'InTransit': '🚚',
      'Delivered': '✅',
    };
    return icons[eventType] || '📝';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Track Your Package</h1>
        <p className="text-2xl text-gray-600">Enter your tracking number to see the current status</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleTrack} className="space-y-6">
          <div>
            <label htmlFor="trackingNumber" className="block text-lg font-semibold text-gray-700 mb-2">
              Tracking Number
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (e.g., ISH20240101001)"
                className="input-field flex-1 text-center text-xl"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className={`btn-primary ${loading || !trackingNumber.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? '🔍 Searching...' : '🔍 Track Package'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Shipment Not Found</h3>
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Shipment Details */}
      {shipment && (
        <div className="space-y-6">
          {/* Shipment Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Shipment Details</h2>
                <p className="text-lg text-gray-600">Tracking Number: {shipment.trackingNumber}</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl mb-2 ${getStatusColor(shipment.status)}`}>
                  {getStatusIcon(shipment.status)}
                </div>
                <div className={`text-xl font-bold ${getStatusColor(shipment.status)}`}>
                  {shipment.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Recipient Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Name:</span> {shipment.recipientName}</div>
                  <div><span className="font-medium">Package Type:</span> {shipment.packageType}</div>
                  {shipment.notes && (
                    <div><span className="font-medium">Notes:</span> {shipment.notes}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Route Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">From:</span> {shipment.fromLocation?.name}</div>
                  <div><span className="font-medium">To:</span> {shipment.toLocation?.name}</div>
                  <div><span className="font-medium">Created:</span> {new Date(shipment.createdDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {shipment.urgencyLevel === 'Urgent' && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🚨</span>
                  <span className="text-lg font-bold text-red-800">URGENT DELIVERY</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Events */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tracking History</h3>
            
            {events.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl text-gray-600">No tracking events yet</p>
                <p className="text-gray-500">Your package is being prepared for shipment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.eventID} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                        {getEventIcon(event.eventType)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {event.eventType === 'PickedUp' ? 'Picked Up' : 
                           event.eventType === 'InTransit' ? 'In Transit' : 
                           event.eventType === 'Delivered' ? 'Delivered' : event.eventType}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.performedByUser && (
                        <p className="text-gray-600">
                          Performed by: {event.performedByUser.name}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-gray-600 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setTrackingNumber('');
                setShipment(null);
                setEvents([]);
                setError('');
              }}
              className="btn-secondary"
            >
              🔍 Track Another Package
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary"
            >
              🖨️ Print Details
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!shipment && !error && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-2xl font-bold text-blue-800 mb-2">Need Help?</h3>
            <p className="text-lg text-blue-600 mb-4">
              Your tracking number should look like: ISH20240101001
            </p>
            <p className="text-blue-600">
              If you don't have a tracking number, you can create a new shipment from the dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPackage;













