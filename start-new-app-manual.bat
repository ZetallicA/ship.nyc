@echo off
echo Starting InterShip application manually...
echo.

echo [1/3] Starting MongoDB in Docker...
start "MongoDB" cmd /k "docker run --rm -p 27017:27017 --name intership-mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0"

timeout /t 5 /nobreak >nul

echo [2/3] Starting FastAPI backend...
cd backend
start "InterShip Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
cd ..

timeout /t 3 /nobreak >nul

echo [3/3] Starting Next.js frontend...
cd frontend
start "InterShip Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Application starting!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
pause

