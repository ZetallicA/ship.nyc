import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/send', label: 'Send Package', icon: '📦' },
    { path: '/track', label: 'Track Package', icon: '🔍' },
    { path: '/mailbox', label: 'Mailbox', icon: '📬' },
    { path: '/scanner', label: 'QR Scanner', icon: '📱' },
    { path: '/admin', label: 'Admin Panel', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-primary-600">InterShip</h1>
            <span className="text-lg text-gray-600">Package Tracking</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">👤</span>
                </div>
                <span className="text-sm text-gray-700">{user?.username || 'User'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;


