# InterShip Troubleshooting Guide

## Issue 1: Logout Not Working

### Problem:
After logout, user is redirected back to dashboard without needing to login.

### Solution:
✅ **Fixed in App.js** - Added `window.location.href = '/login'` to force page reload and clear cached state.

### Test:
1. Login to the application
2. Click logout
3. You should be redirected to login page
4. Try accessing dashboard directly - should redirect to login

---

## Issue 2: External Machines Cannot Connect to Backend

### Problem:
- Local machine: ✅ Can login via `mail.oathone.com`
- External machines: ❌ Can load login page but get "cannot connect to backend" error

### Root Cause Analysis:

#### 1. **Cloudflare Tunnel Configuration**
Check your tunnel routes in Cloudflare dashboard:

**Current Configuration (from your screenshot):**
```
mail.oathone.com → https://192.168.8.199:3000 ✅
mailbackend.oathone.com → http://192.168.8.199:5000 ❌
```

**Required Configuration:**
```
mail.oathone.com → https://192.168.8.199:3000 ✅
mailbackend.oathone.com → https://192.168.8.199:7000 ✅
```

#### 2. **Backend Listening Configuration**
Your backend is correctly configured:
```csharp
app.Urls.Add("http://0.0.0.0:5000");   // HTTP on all interfaces
app.Urls.Add("https://0.0.0.0:7000");   // HTTPS on all interfaces
```

#### 3. **CORS Configuration**
Your CORS is correctly configured to allow:
- `https://mail.oathone.com` (production)
- `https://localhost:3000` (development)

---

## Fix Steps:

### Step 1: Update Cloudflare Tunnel Route

1. **Go to Cloudflare Dashboard** → Tunnels → OATH One
2. **Find the `mailbackend.oathone.com` entry**
3. **Click the menu (three dots)** → Edit
4. **Change the service to**: `https://192.168.8.199:7000`
5. **Save the changes**

### Step 2: Verify Backend is Running

Check if backend is listening on the correct ports:
```cmd
netstat -an | findstr ":7000"
```

Should show:
```
TCP    0.0.0.0:7000           0.0.0.0:0              LISTENING
```

### Step 3: Test Backend Connectivity

From external machine, test:
```bash
curl -k https://mailbackend.oathone.com/api/officelocations
```

Should return JSON data, not connection error.

### Step 4: Check Cloudflare Tunnel Status

1. **Verify tunnel is running**:
   ```bash
   cloudflared tunnel list
   ```

2. **Check tunnel logs**:
   ```bash
   cloudflared tunnel run your-tunnel-name
   ```

### Step 5: Test Frontend-Backend Communication

1. **Open browser developer tools**
2. **Go to Network tab**
3. **Try to login**
4. **Check if API calls to `mailbackend.oathone.com` are successful**

---

## Common Issues and Solutions:

### Issue: "Mixed Content" Errors
**Cause**: Frontend (HTTPS) trying to access backend (HTTP)
**Solution**: Ensure backend tunnel route uses `https://` not `http://`

### Issue: "CORS" Errors
**Cause**: Backend not allowing frontend domain
**Solution**: Check CORS policy includes `https://mail.oathone.com`

### Issue: "Connection Refused"
**Cause**: Backend not running or wrong port
**Solution**: 
1. Ensure backend is running on port 7000
2. Check tunnel route points to correct port
3. Verify firewall allows port 7000

### Issue: "SSL Certificate" Errors
**Cause**: Self-signed certificates not trusted
**Solution**: 
1. Use Cloudflare's SSL termination
2. Or configure proper SSL certificates

---

## Testing Checklist:

### ✅ Local Testing:
- [ ] Backend running on `https://localhost:7000`
- [ ] Frontend running on `https://localhost:3000`
- [ ] Login works locally
- [ ] Logout works locally

### ✅ Production Testing:
- [ ] Backend running on `https://0.0.0.0:7000`
- [ ] Cloudflare tunnel running
- [ ] Tunnel route: `mailbackend.oathone.com → https://192.168.8.199:7000`
- [ ] Frontend accessible at `https://mail.oathone.com`
- [ ] Backend accessible at `https://mailbackend.oathone.com/api`
- [ ] Login works from external machines
- [ ] Logout works from external machines

---

## Quick Fix Commands:

### Restart Backend:
```cmd
cd Y:\proj2\InterShip.Api
dotnet run --urls "https://0.0.0.0:7000"
```

### Restart Frontend:
```cmd
cd Y:\proj2\InterShip.Client
set REACT_APP_API_URL=https://mailbackend.oathone.com/api
set HTTPS=true
set HOST=0.0.0.0
npm start
```

### Check Ports:
```cmd
netstat -an | findstr ":3000\|:7000"
```

---

## Support:

If issues persist:
1. Check Cloudflare tunnel logs
2. Verify backend logs for errors
3. Test API endpoints directly
4. Check browser developer console for errors


