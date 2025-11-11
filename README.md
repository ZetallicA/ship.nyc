# OATH Logistics - Internal Mail & Package Tracking System

A complete package tracking system built with Next.js 15, FastAPI, and MongoDB.

## Features

- 🔐 JWT-based authentication (no external services)
- 📦 Send packages with 6-step wizard
- 🔍 Track packages with real-time status updates
- 👥 Admin panel for managing offices, users, and shipments
- 📱 QR code generation for shipping labels
- 🖨️ Print-friendly shipping labels

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+
- **Database**: MongoDB
- **Authentication**: JWT (python-jose)
- **QR Codes**: qrcode.react

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
3. Start all services:
   ```bash
   docker-compose up
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start MongoDB (or use Docker):
   ```bash
   docker run -d -p 27017:27017 --name mongodb \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password123 \
     mongo:7.0
   ```

5. Run the backend:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Offices (Admin only)
- `GET /api/offices` - List all offices
- `POST /api/offices` - Create new office

### Shipments
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/{tracking_number}` - Get shipment details
- `GET /api/shipments` - List all shipments (Admin only)
- `GET /api/events/{tracking_number}` - Get shipment events

### Users (Admin only)
- `GET /api/users` - List all users

## Tracking Number Format

Tracking numbers follow the format: `PKG-YYYY-NNNNN`
- `PKG` - Prefix
- `YYYY` - Year
- `NNNNN` - Sequential number (5 digits, zero-padded)

Example: `PKG-2025-00001`

## Default Roles

- **Sender**: Can send and track packages
- **Driver**: Can update package status
- **Admin**: Full system access

## Environment Variables

See `.env.example` for all configuration options.

## Development

The project uses:
- TypeScript for type safety
- Tailwind CSS for styling
- MongoDB for data persistence
- JWT for authentication

## License

MIT
