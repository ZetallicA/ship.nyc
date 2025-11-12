import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI, userAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    deliveredToday: 0,
    activeUsers: 0,
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load shipments
      const shipmentsResponse = await shipmentAPI.getAll();
      const shipments = shipmentsResponse.data;
      
      // Load users
      const usersResponse = await userAPI.getAll();
      const users = usersResponse.data;
      
      // Calculate stats
      const totalShipments = shipments.length;
      const pendingShipments = shipments.filter(s => s.status !== 'Delivered').length;
      const deliveredToday = shipments.filter(s => 
        s.status === 'Delivered' && 
        new Date(s.createdDate).toDateString() === new Date().toDateString()
      ).length;
      const activeUsers = users.length;
      
      setStats({
        totalShipments,
        pendingShipments,
        deliveredToday,
        activeUsers,
      });
      
      // Get recent shipments (last 5)
      const recent = shipments
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);
      
      setRecentShipments(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to InterShip</h1>
        <p className="text-2xl text-gray-600">Your internal package tracking system</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/send"
          className="card hover:shadow-xl transition-shadow duration-200 text-center group"
        >
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Package</h3>
          <p className="text-lg text-gray-600">Create a new shipment</p>
        </Link>
        
        <Link
          to="/track"
          className="card hover:shadow-xl transition-shadow duration-200 text-center group"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Track Package</h3>
          <p className="text-lg text-gray-600">Find your shipment</p>
        </Link>
        
        <Link
          to="/admin"
          className="card hover:shadow-xl transition-shadow duration-200 text-center group"
        >
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h3>
          <p className="text-lg text-gray-600">Manage system</p>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-4xl text-primary-600 mb-2">📊</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalShipments}</div>
          <div className="text-lg text-gray-600">Total Shipments</div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl text-yellow-600 mb-2">⏳</div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingShipments}</div>
          <div className="text-lg text-gray-600">Pending</div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl text-success-600 mb-2">✅</div>
          <div className="text-3xl font-bold text-gray-900">{stats.deliveredToday}</div>
          <div className="text-lg text-gray-600">Delivered Today</div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl text-purple-600 mb-2">👥</div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeUsers}</div>
          <div className="text-lg text-gray-600">Active Users</div>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Recent Shipments</h2>
        
        {recentShipments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-600">No shipments yet</p>
            <Link to="/send" className="btn-primary mt-4 inline-block">
              Send Your First Package
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentShipments.map((shipment) => (
              <div key={shipment.shipmentID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">📦</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {shipment.trackingNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      {shipment.recipientName} • {shipment.packageType}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(shipment.status)}
                  <div className="text-sm text-gray-500">
                    {new Date(shipment.createdDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;













