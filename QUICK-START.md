# Quick Start Guide - New InterShip Application

## ✅ Port 3000 is Now Free!

The old React app has been stopped. You can now start the new Next.js application.

## Option 1: Quick Start (Frontend Only for Testing)

The frontend is now installing dependencies. Once done, you can start it with:

```bash
cd frontend
npm run dev
```

Then open: http://localhost:3000

**Note:** You'll need the backend running for full functionality. See Option 2 below.

## Option 2: Full Stack with Docker Compose (Recommended)

Start everything with one command:

```bash
docker-compose up --build
```

This will start:
- MongoDB on port 27017
- FastAPI backend on port 8000
- Next.js frontend on port 3000

## Option 3: Manual Start

### 1. Start MongoDB
```bash
docker run -d -p 27017:27017 --name intership-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

## Using the Batch Scripts

I've created two batch files for Windows:

- **`start-new-app.bat`** - Starts everything with Docker Compose
- **`start-new-app-manual.bat`** - Starts everything manually in separate windows

## First Steps

1. **Register a new user:**
   - Go to http://localhost:3000/login
   - Click "Register" tab
   - Fill in details (try creating an Admin user first)

2. **Create an Office (Admin only):**
   - Login as Admin
   - Go to Admin Panel → Offices tab
   - Click "Add Office"
   - Create at least one office

3. **Send a Package:**
   - Go to Dashboard → "Send Package"
   - Follow the 6-step wizard
   - Get your QR code shipping label!

## Troubleshooting

**Port 3000 still in use?**
```bash
# Find what's using it
netstat -ano | findstr :3000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Backend not connecting?**
- Make sure MongoDB is running
- Check backend logs for errors
- Verify MongoDB URL in backend/.env

**Frontend shows connection errors?**
- Make sure backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in frontend/.env.local

