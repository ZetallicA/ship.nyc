# InterShip Features Documentation

## 🆕 Recently Added Features

### 1. Driver QR Code Scanner Page
**Location:** `/driver/scan`

A dedicated mobile-friendly page for drivers to scan packages and update delivery status.

**Features:**
- 📸 **Camera QR Scanning**: Use device camera to scan QR codes on package labels
  - Works on Chrome desktop, iOS Safari, and Android browsers
  - Automatically detects and extracts tracking numbers
  - Uses native BarcodeDetector API when available
- ✏️ **Manual Entry Fallback**: Enter tracking numbers manually if camera is unavailable
- 📊 **Real-time Shipment Preview**: Shows package details after scanning
- 🔄 **Status Updates**: Quick dropdown to update status (Picked Up, In Transit, Delivered, Returned)
- 📋 **Scan History**: Tracks last 20 scans with success/failure status
- 📱 **Mobile Optimized**: Responsive design works great on phones and tablets

**Access:** Available to users with Driver or Admin role

### 2. Email Notifications
Automatic email notifications sent to senders when their package is delivered.

**Configuration:**
Set up SMTP credentials in your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@intership.com
```

**Email Contents:**
- Tracking number
- Recipient name
- Delivery timestamp
- Professional HTML formatting

**Supported Providers:**
- Gmail (with app password)
- SendGrid
- Mailgun
- AWS SES
- Outlook/Office 365

### 3. Enhanced Tracking Timeline
**Location:** `/track`

Improved shipment tracking page with:
- 🟡 **Status Icons**: Visual indicators (🟡 Created, 🟠 Picked Up, 🟣 In Transit, ✅ Delivered, 🔴 Returned)
- ⏱️ **Detailed Timestamps**: Shows date and time for each status change
- 📝 **Event Descriptions**: Who updated the status and when
- 🎨 **Color-coded Events**: Each status has its own distinctive color scheme

### 4. Admin Panel Enhancements
**Location:** `/admin` → Shipments Tab

**CSV Export:**
- 📥 **Export to CSV**: Download shipment data as CSV file
- 🔍 **Smart Filtering**: Export only what you see based on active filters
- 📊 **Complete Data**: Includes tracking number, status, recipient, destination, package type, urgency, sender, and timestamps

**Advanced Filtering:**
- **Status Filter**: Filter by Created, Picked Up, In Transit, Delivered, or Returned
- **Date Range**: Filter shipments created between specific dates
- **Real-time Results**: Filters update instantly

**Timeline View:**
- 📅 **Modal Timeline**: Click "Timeline" button on any shipment to view full event history
- 🎯 **Quick Access**: View timeline without leaving the admin panel
- 📊 **Same Visual Design**: Consistent with tracking page timeline

### 5. NFC Tag Support (Optional/Experimental)

**Browser Support:**
- Chrome on Android 89+ (with Web NFC enabled)
- Not supported on iOS/Safari (iOS restrictions)
- Experimental feature

**How to Use:**
If your device supports NFC:
1. Enable Web NFC in chrome://flags (Android Chrome)
2. Use the driver scan page
3. Tap NFC-enabled package labels
4. Status will update automatically

**Note:** Manual/QR scanning is recommended for broader compatibility.

## 📱 Mobile Features

### Responsive Design
All pages are optimized for mobile:
- Touch-friendly buttons and inputs
- Larger tap targets
- Swipe gestures where appropriate
- Mobile-optimized layouts

### Camera Access
The QR scanner requests camera permission:
- **First Time**: Browser will prompt for permission
- **Denied**: Falls back to manual entry
- **No Camera**: Automatically shows manual entry only

### Offline Support
- Scan history stored locally (last 20 scans)
- Works offline after initial load
- Syncs when connection restored

## 🔐 Security Features

### Role-Based Access
- **Senders**: Create shipments, track own packages
- **Drivers**: Scan and update package status, view assigned packages
- **Admins**: Full system access, user management, reports

### PIN-Based Login
- Users can set 6-digit PIN for quick login
- Requires ID number (assigned by admin)
- PIN hashed with bcrypt

### Email-Based Login
- Users can log in with email + password
- Username login also supported
- JWT token authentication

## 📊 Dashboard Statistics

Real-time stats for all roles:
- Total shipments
- Active shipments
- Delivered today
- Pending pickups

## 🎯 Next Steps

### Recommended Setup Order:
1. Configure SMTP for email notifications
2. Train drivers on QR scanner page
3. Set up CSV export schedule for reporting
4. Test mobile camera scanning
5. (Optional) Experiment with NFC tags

### Best Practices:
- Print QR code labels for all packages
- Use mobile devices for driver scanning
- Export CSV reports weekly/monthly
- Monitor delivery notifications
- Keep driver app bookmarked on mobile home screen

## 🛠️ Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS connection
- Try different browser (Chrome recommended)
- Use manual entry as fallback

### Emails Not Sending
- Verify SMTP credentials in .env
- Check if sender email has enabled less secure apps / app password
- Look at backend logs for error messages
- Test with a different SMTP provider

### Timeline Not Loading
- Check network connection
- Verify tracking number is correct
- Ensure backend is running
- Check browser console for errors

### CSV Export Empty
- Verify you have shipments matching the filters
- Try clearing date filters
- Ensure you're logged in as Admin

## 📞 Support

For issues or feature requests, check:
- Backend logs: `docker logs intership-backend`
- Frontend console: Browser DevTools → Console
- Network requests: Browser DevTools → Network

