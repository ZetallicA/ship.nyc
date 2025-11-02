import React, { useState, useEffect } from 'react';
import { locationScanAPI, shipmentAPI, officeLocationAPI } from '../services/api';

const QRScanner = () => {
  const [scannedData, setScannedData] = useState('');
  const [shipments, setShipments] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState('Pickup');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipmentsResponse, locationsResponse] = await Promise.all([
        shipmentAPI.getAll(),
        officeLocationAPI.getAll()
      ]);
      
      setShipments(shipmentsResponse.data);
      setOfficeLocations(locationsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async () => {
    if (!scannedData.trim()) {
      alert('Please enter scanned data');
      return;
    }

    try {
      setLoading(true);
      
      // Parse QR code data (format: LOCATION:ID:NAME)
      const parts = scannedData.split(':');
      if (parts.length < 3 || parts[0] !== 'LOCATION') {
        alert('Invalid QR code format');
        return;
      }

      const locationId = parseInt(parts[1]);
      const locationName = parts[2];

      // Validate QR code
      const isValid = await locationScanAPI.validateQR(scannedData);
      if (!isValid) {
        alert('Invalid QR code');
        return;
      }

      // Find the location
      const location = officeLocations.find(loc => loc.officeLocationID === locationId);
      if (!location) {
        alert('Location not found');
        return;
      }

      setScanResult({
        location,
        isValid: true,
        message: `QR code validated for ${location.name}`
      });

    } catch (error) {
      console.error('Error validating QR code:', error);
      setScanResult({
        location: null,
        isValid: false,
        message: 'Error validating QR code'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationScan = async () => {
    if (!selectedShipment || !scanResult?.location) {
      alert('Please select a shipment and scan a location QR code first');
      return;
    }

    try {
      setLoading(true);
      
      const scanRequest = {
        shipmentId: selectedShipment.shipmentID,
        officeLocationId: scanResult.location.officeLocationID,
        scannedByUserId: 1, // This should come from authentication
        scanType: scanType,
        notes: notes
      };

      const response = await locationScanAPI.scan(scanRequest);
      
      alert(`Location scan recorded successfully for ${scanResult.location.name}`);
      
      // Reset form
      setScannedData('');
      setSelectedShipment(null);
      setScanResult(null);
      setNotes('');
      
    } catch (error) {
      console.error('Error recording location scan:', error);
      alert('Error recording location scan');
    } finally {
      setLoading(false);
    }
  };

  const handleLabelScan = async () => {
    if (!scannedData.trim()) {
      alert('Please enter scanned label data');
      return;
    }

    try {
      setLoading(true);
      
      // Look for shipment by tracking number
      const shipment = await shipmentAPI.getByTrackingNumber(scannedData);
      
      if (shipment.data) {
        setSelectedShipment(shipment.data);
        setScanResult({
          shipment: shipment.data,
          isValid: true,
          message: `Shipment found: ${shipment.data.recipientName}`
        });
      } else {
        setScanResult({
          shipment: null,
          isValid: false,
          message: 'Shipment not found'
        });
      }
      
    } catch (error) {
      console.error('Error scanning label:', error);
      setScanResult({
        shipment: null,
        isValid: false,
        message: 'Error scanning label'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl text-gray-600">Loading scanner...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">QR Code Scanner</h1>
        <p className="text-2xl text-gray-600">Scan labels and location QR codes for package tracking</p>
      </div>

      {/* Scanner Interface */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Scanner Interface</h3>
        
        <div className="space-y-6">
          {/* QR Code Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scanned Data (QR Code or Label)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                className="input-field flex-1"
                placeholder="Enter scanned QR code or tracking number"
              />
              <button
                onClick={handleLabelScan}
                className="btn-primary"
                disabled={!scannedData.trim()}
              >
                🔍 Scan Label
              </button>
              <button
                onClick={handleQRScan}
                className="btn-secondary"
                disabled={!scannedData.trim()}
              >
                📱 Scan QR Code
              </button>
            </div>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className={`p-4 rounded-lg border ${
              scanResult.isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{scanResult.isValid ? '✅' : '❌'}</span>
                <div>
                  <p className={`font-semibold ${
                    scanResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {scanResult.message}
                  </p>
                  {scanResult.location && (
                    <p className="text-sm text-gray-600">
                      Location: {scanResult.location.name} - {scanResult.location.address}
                    </p>
                  )}
                  {scanResult.shipment && (
                    <p className="text-sm text-gray-600">
                      Shipment: {scanResult.shipment.trackingNumber} - {scanResult.shipment.recipientName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shipment Selection */}
          {scanResult?.shipment && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selected Shipment
              </label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">Tracking: {scanResult.shipment.trackingNumber}</p>
                <p className="text-sm text-gray-600">Recipient: {scanResult.shipment.recipientName}</p>
                <p className="text-sm text-gray-600">Status: {scanResult.shipment.status}</p>
              </div>
            </div>
          )}

          {/* Location Scan Options */}
          {scanResult?.location && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Record Location Scan</h4>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scan Type
                </label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="input-field"
                >
                  <option value="Pickup">Pickup</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Transit">Transit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  placeholder="Additional notes about the scan"
                  rows="3"
                />
              </div>

              <button
                onClick={handleLocationScan}
                className="btn-primary"
                disabled={!selectedShipment}
              >
                📍 Record Location Scan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Available Shipments */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Available Shipments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.slice(0, 6).map((shipment) => (
            <div
              key={shipment.shipmentID}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedShipment?.shipmentID === shipment.shipmentID
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedShipment(shipment)}
            >
              <p className="font-semibold text-gray-900">{shipment.trackingNumber}</p>
              <p className="text-sm text-gray-600">{shipment.recipientName}</p>
              <p className="text-sm text-gray-500">Status: {shipment.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;


