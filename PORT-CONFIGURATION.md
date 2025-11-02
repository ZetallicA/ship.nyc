# Port Configuration

## Current Port Setup

Due to port 3000 being already allocated, the application uses the following ports:

### Frontend
- **External Access**: Port `8080` (for accessing from host machine or network)
- **Internal Container**: Port `3000` (internal Docker network)
- **Access URLs**:
  - Local: `http://localhost:8080`
  - Network: `http://192.168.8.199:8080`
  
**Note**: Ports 3000, 3001, and 3002 were already in use, so port 8080 is used instead.

### Backend API
- **Port**: `8000` (both external and internal)
- **Access URL**: `http://localhost:8000/api`
- **Network URL**: `http://192.168.8.199:8000/api`

### MongoDB
- **Port**: `27017` (both external and internal)
- **Access**: For development/debugging only

## Changing Ports

If you need to change the frontend port:

1. Edit `docker-compose.yml`:
   ```yaml
   ports:
     - "NEW_PORT:3000"  # Change NEW_PORT to your desired port
   ```

2. Update CORS origins in `docker-compose.yml`:
   ```yaml
   - CORS_ORIGINS=http://localhost:NEW_PORT,http://127.0.0.1:NEW_PORT,http://0.0.0.0:NEW_PORT,http://192.168.8.199:NEW_PORT
   ```

3. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Port Conflict Resolution

If you get "port is already allocated" errors:
- Check what's using the port: `netstat -ano | findstr :PORT_NUMBER` (Windows) or `lsof -i :PORT_NUMBER` (Linux/Mac)
- Use a different port in the `docker-compose.yml` ports mapping
- The internal container port (3000 for frontend) should remain the same

