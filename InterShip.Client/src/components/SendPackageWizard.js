import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { officeLocationAPI, shipmentAPI } from '../services/api';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SendPackageWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  
  const [shipmentData, setShipmentData] = useState({
    fromLocationID: 1, // Default to first office
    toLocationID: null,
    senderID: 1, // Default sender
    recipientName: '',
    packageType: '',
    notes: '',
    urgencyLevel: 'Normal',
  });

  const steps = [
    { number: 1, title: 'Choose Destination', description: 'Select the destination office' },
    { number: 2, title: 'Recipient Details', description: 'Enter recipient information' },
    { number: 3, title: 'Package Type', description: 'Select package type' },
    { number: 4, title: 'Notes & Urgency', description: 'Add notes and urgency level' },
    { number: 5, title: 'Confirm Details', description: 'Review and confirm' },
    { number: 6, title: 'Print Label', description: 'Generate and print label' },
  ];

  useEffect(() => {
    loadOfficeLocations();
  }, []);

  const loadOfficeLocations = async () => {
    try {
      const response = await officeLocationAPI.getAll();
      setOfficeLocations(response.data);
    } catch (error) {
      console.error('Error loading office locations:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await shipmentAPI.create(shipmentData);
      const createdShipment = response.data;
      
      // Update shipment data with tracking number from API response
      setShipmentData(prev => ({
        ...prev,
        trackingNumber: createdShipment.trackingNumber
      }));
      
      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(createdShipment.trackingNumber);
      setQrCodeDataURL(qrCodeDataURL);
      
      setCurrentStep(6);
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Error creating shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    const labelElement = document.getElementById('shipping-label');
    if (!labelElement) return;

    try {
      const canvas = await html2canvas(labelElement, {
        scale: 2,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`shipment-${shipmentData.trackingNumber || 'label'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getStepIndicator = (stepNumber) => {
    if (stepNumber < currentStep) {
      return 'step-completed';
    } else if (stepNumber === currentStep) {
      return 'step-active';
    } else {
      return 'step-pending';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Choose Destination Office</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officeLocations.map((location) => (
                <button
                  key={location.officeLocationID}
                  onClick={() => setShipmentData({ ...shipmentData, toLocationID: location.officeLocationID })}
                  className={`p-6 rounded-lg border-2 text-left transition-colors duration-200 ${
                    shipmentData.toLocationID === location.officeLocationID
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
                  <p className="text-gray-600 mt-2">{location.address}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Enter Recipient Name</h2>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={shipmentData.recipientName}
                onChange={(e) => setShipmentData({ ...shipmentData, recipientName: e.target.value })}
                placeholder="Enter recipient name"
                className="input-field text-center text-xl"
                autoFocus
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Select Package Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Document', 'Package', 'Envelope', 'Box'].map((type) => (
                <button
                  key={type}
                  onClick={() => setShipmentData({ ...shipmentData, packageType: type })}
                  className={`p-6 rounded-lg border-2 text-center transition-colors duration-200 ${
                    shipmentData.packageType === type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {type === 'Document' ? '📄' : type === 'Package' ? '📦' : type === 'Envelope' ? '✉️' : '📦'}
                  </div>
                  <div className="text-lg font-semibold">{type}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Notes & Urgency Level</h2>
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={shipmentData.notes}
                  onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
                  placeholder="Add any special instructions or notes..."
                  className="input-field h-24 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Urgency Level</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShipmentData({ ...shipmentData, urgencyLevel: 'Normal' })}
                    className={`p-4 rounded-lg border-2 text-center transition-colors duration-200 ${
                      shipmentData.urgencyLevel === 'Normal'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">🐌</div>
                    <div className="font-semibold">Normal</div>
                  </button>
                  
                  <button
                    onClick={() => setShipmentData({ ...shipmentData, urgencyLevel: 'Urgent' })}
                    className={`p-4 rounded-lg border-2 text-center transition-colors duration-200 ${
                      shipmentData.urgencyLevel === 'Urgent'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">🚀</div>
                    <div className="font-semibold">Urgent</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        const selectedToLocation = officeLocations.find(loc => loc.officeLocationID === shipmentData.toLocationID);
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Confirm Details</h2>
            <div className="max-w-2xl mx-auto">
              <div className="card space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold">To:</span>
                  <span>{selectedToLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Recipient:</span>
                  <span>{shipmentData.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Package Type:</span>
                  <span>{shipmentData.packageType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Urgency:</span>
                  <span className={`font-semibold ${shipmentData.urgencyLevel === 'Urgent' ? 'text-red-600' : 'text-gray-600'}`}>
                    {shipmentData.urgencyLevel}
                  </span>
                </div>
                {shipmentData.notes && (
                  <div>
                    <span className="font-semibold">Notes:</span>
                    <p className="text-gray-600 mt-1">{shipmentData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Shipping Label Generated!</h2>
            <div className="max-w-md mx-auto">
              <div id="shipping-label" className="card text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">InterShip</h3>
                {qrCodeDataURL && (
                  <div className="mb-4">
                    <img src={qrCodeDataURL} alt="QR Code" className="mx-auto" />
                    <div className="text-lg text-gray-600 mt-2 font-mono">{shipmentData.trackingNumber}</div>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  <div>To: {shipmentData.recipientName}</div>
                  <div>Type: {shipmentData.packageType}</div>
                  {shipmentData.urgencyLevel === 'Urgent' && (
                    <div className="text-red-600 font-bold">URGENT</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`step-indicator ${getStepIndicator(step.number)}`}>
                {step.number < currentStep ? '✔️' : step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step.number < currentStep ? 'bg-success-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Step {currentStep}: {steps[currentStep - 1].title}
          </h3>
          <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="card min-h-96">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ← Previous
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !shipmentData.toLocationID) ||
              (currentStep === 2 && !shipmentData.recipientName) ||
              (currentStep === 3 && !shipmentData.packageType)
            }
            className={`btn-primary ${
              (currentStep === 1 && !shipmentData.toLocationID) ||
              (currentStep === 2 && !shipmentData.recipientName) ||
              (currentStep === 3 && !shipmentData.packageType)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            Next →
          </button>
        ) : currentStep === 5 ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-success"
          >
            {loading ? 'Creating...' : 'Create Shipment'}
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handlePrintLabel}
              className="btn-primary"
            >
              🖨️ Print Label
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              🏠 Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendPackageWizard;

