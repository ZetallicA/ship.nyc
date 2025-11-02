from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:password123@localhost:27017/intership?authSource=admin")
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Database
client = MongoClient(MONGODB_URL)
db = client.intership
users_collection = db.users
offices_collection = db.offices
shipments_collection = db.shipments
events_collection = db.shipment_events

# Security - Use bcrypt directly to avoid passlib issues
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# FastAPI app
app = FastAPI(title="InterShip API", version="1.0.0")

# CORS - Support both localhost and IP addresses
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
# Log CORS origins for debugging
print(f"CORS Origins configured: {cors_origins}")
# Allow all origins that match pattern (for IP access)
# In production, be more restrictive
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "Sender"
    pin: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool = True

class UserInDB(UserResponse):
    password_hash: str
    pin_hash: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PINLoginRequest(BaseModel):
    email: EmailStr
    pin: str

class OfficeCreate(BaseModel):
    name: str
    address: str

class OfficeResponse(BaseModel):
    id: str
    name: str
    address: str
    created_date: datetime

class ShipmentCreate(BaseModel):
    destination_office_id: str
    recipient_name: str
    package_type: str
    urgency: str = "Normal"
    notes: Optional[str] = None

class ShipmentEvent(BaseModel):
    tracking_number: str
    event_type: str
    description: str
    timestamp: datetime

class ShipmentResponse(BaseModel):
    id: Optional[str] = None
    tracking_number: str
    destination_office_id: str
    destination_office_name: str
    recipient_name: str
    package_type: str
    urgency: str
    notes: Optional[str]
    status: str
    created_date: datetime
    sender_id: str

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        return False

def get_password_hash(password: str) -> str:
    # Ensure password is not longer than 72 bytes for bcrypt
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    try:
        return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))
    except:
        return False

def get_pin_hash(pin: str) -> str:
    # PINs are shorter, but still use bcrypt for security
    pin_bytes = pin.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pin_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def generate_tracking_number() -> str:
    """Generate tracking number in format PKG-YYYY-NNNNN"""
    year = datetime.now().year
    # Get the last shipment number for this year
    last_shipment = shipments_collection.find_one(
        {"tracking_number": {"$regex": f"^PKG-{year}-"}},
        sort=[("created_date", -1)]
    )
    if last_shipment and last_shipment.get("tracking_number", "").startswith(f"PKG-{year}-"):
        try:
            last_num = int(last_shipment["tracking_number"].split("-")[-1])
            next_num = last_num + 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    return f"PKG-{year}-{str(next_num).zfill(5)}"

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    user_dict = {**user, "id": str(user["_id"])}
    # Ensure pin_hash is present (even if None)
    if "pin_hash" not in user_dict:
        user_dict["pin_hash"] = None
    return UserInDB(**user_dict)

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Check if user exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate PIN if provided (should be 4-8 digits)
    if user.pin:
        if not user.pin.isdigit() or len(user.pin) < 4 or len(user.pin) > 8:
            raise HTTPException(status_code=400, detail="PIN must be 4-8 digits")
    
    # Create user
    user_dict = {
        "email": user.email,
        "password_hash": get_password_hash(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "is_active": True,
        "created_date": datetime.utcnow()
    }
    
    # Add PIN hash if provided
    if user.pin:
        user_dict["pin_hash"] = get_pin_hash(user.pin)
    
    result = users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    user_dict.pop("_id", None)
    user_dict.pop("password_hash", None)
    user_dict.pop("pin_hash", None)
    return UserResponse(**user_dict)

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login-pin", response_model=Token)
async def login_pin(login_data: PINLoginRequest):
    user = users_collection.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user has a PIN set
    if not user.get("pin_hash"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN not set for this user. Please use email/password login or set a PIN first.",
        )
    
    # Verify PIN
    if not verify_pin(login_data.pin, user["pin_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class PINUpdateRequest(BaseModel):
    pin: str

@app.put("/api/auth/pin", response_model=dict)
async def update_pin(
    pin_data: PINUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Set or update user's PIN"""
    # Validate PIN (4-8 digits)
    if not pin_data.pin.isdigit() or len(pin_data.pin) < 4 or len(pin_data.pin) > 8:
        raise HTTPException(status_code=400, detail="PIN must be 4-8 digits")
    
    # Update user's PIN hash
    users_collection.update_one(
        {"email": current_user.email},
        {"$set": {"pin_hash": get_pin_hash(pin_data.pin)}}
    )
    
    return {"message": "PIN updated successfully"}

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@app.get("/api/offices", response_model=List[OfficeResponse])
async def list_offices():
    offices = list(offices_collection.find().sort("created_date", -1))
    result = []
    for office in offices:
        office_dict = {**office, "id": str(office["_id"])}
        office_dict.pop("_id", None)
        result.append(OfficeResponse(**office_dict))
    return result

@app.post("/api/offices", response_model=OfficeResponse)
async def create_office(office: OfficeCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    office_dict = {
        **office.dict(),
        "created_date": datetime.utcnow()
    }
    result = offices_collection.insert_one(office_dict)
    office_dict["id"] = str(result.inserted_id)
    office_dict.pop("_id", None)
    return OfficeResponse(**office_dict)

@app.post("/api/shipments", response_model=ShipmentResponse)
async def create_shipment(shipment: ShipmentCreate, current_user: UserInDB = Depends(get_current_user)):
    # Get destination office
    try:
        office = offices_collection.find_one({"_id": ObjectId(shipment.destination_office_id)})
    except:
        office = None
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Generate tracking number
    tracking_number = generate_tracking_number()
    
    # Create shipment
    shipment_dict = {
        "tracking_number": tracking_number,
        "destination_office_id": shipment.destination_office_id,
        "destination_office_name": office["name"],
        "recipient_name": shipment.recipient_name,
        "package_type": shipment.package_type,
        "urgency": shipment.urgency,
        "notes": shipment.notes or "",
        "status": "Created",
        "sender_id": str(current_user.id),
        "created_date": datetime.utcnow()
    }
    result = shipments_collection.insert_one(shipment_dict)
    
    # Create initial event
    event_dict = {
        "tracking_number": tracking_number,
        "event_type": "Created",
        "description": "Shipment created",
        "timestamp": datetime.utcnow()
    }
    events_collection.insert_one(event_dict)
    
    shipment_dict["id"] = str(result.inserted_id)
    shipment_dict.pop("_id", None)
    return ShipmentResponse(**shipment_dict)

@app.get("/api/shipments/my", response_model=List[ShipmentResponse])
async def get_my_shipments(current_user: UserInDB = Depends(get_current_user)):
    """Get shipments sent by the current user (for Senders and Admins)"""
    # Both Senders and Admins can see their own shipments
    if current_user.role not in ["Sender", "Admin"]:
        raise HTTPException(status_code=403, detail="This endpoint is for Senders and Admins only")
    
    shipments = list(shipments_collection.find({"sender_id": str(current_user.id)}).sort("created_date", -1))
    result = []
    for s in shipments:
        s_dict = {**s, "id": str(s["_id"])}
        s_dict.pop("_id", None)
        result.append(ShipmentResponse(**s_dict))
    return result


@app.get("/api/shipments", response_model=List[ShipmentResponse])
async def list_shipments(
    status: Optional[str] = None,
    office_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {}
    
    # Filter by role
    if current_user.role == "Sender":
        # Senders can only see their own shipments
        query["sender_id"] = str(current_user.id)
    elif current_user.role == "Driver":
        # Drivers can see shipments by status and location
        if status:
            query["status"] = status
        if office_id:
            query["destination_office_id"] = office_id
        # Drivers see shipments that need action (not just Created)
        if not status:
            query["status"] = {"$in": ["Created", "PickedUp", "InTransit"]}
    # Admins can see all shipments
    
    if status and current_user.role != "Driver":
        query["status"] = status
    if office_id and current_user.role != "Driver":
        query["destination_office_id"] = office_id
    
    shipments = list(shipments_collection.find(query).sort("created_date", -1))
    result = []
    for s in shipments:
        s_dict = {**s, "id": str(s["_id"])}
        s_dict.pop("_id", None)
        result.append(ShipmentResponse(**s_dict))
    return result

@app.get("/api/shipments/{tracking_number}", response_model=ShipmentResponse)
async def get_shipment(tracking_number: str):
    shipment = shipments_collection.find_one({"tracking_number": tracking_number})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment_dict = {**shipment, "id": str(shipment["_id"])}
    shipment_dict.pop("_id", None)
    return ShipmentResponse(**shipment_dict)

@app.get("/api/events/{tracking_number}", response_model=List[ShipmentEvent])
async def get_shipment_events(tracking_number: str):
    events = list(events_collection.find({"tracking_number": tracking_number}).sort("timestamp", 1))
    result = []
    for e in events:
        e_dict = {**e}
        e_dict.pop("_id", None)
        result.append(ShipmentEvent(**e_dict))
    return result

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = list(users_collection.find())
    result = []
    for u in users:
        u_dict = {**u, "id": str(u["_id"])}
        u_dict.pop("_id", None)
        u_dict.pop("password_hash", None)
        result.append(UserResponse(**u_dict))
    return result

@app.get("/api/stats")
async def get_stats(
    office_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get dashboard statistics - role-based"""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Base query - role-based filtering
    query = {}
    if current_user.role == "Sender":
        # Senders see only their own shipments
        query["sender_id"] = str(current_user.id)
    elif current_user.role == "Driver":
        # Drivers see shipments they need to manage
        query["status"] = {"$in": ["Created", "PickedUp", "InTransit"]}
        if office_id:
            query["destination_office_id"] = office_id
    # Admins see all shipments (no query filter)
    
    if office_id and current_user.role == "Admin":
        query["destination_office_id"] = office_id
    
    total_shipments = shipments_collection.count_documents(query)
    in_transit = shipments_collection.count_documents({**query, "status": "InTransit"})
    delivered_today = shipments_collection.count_documents({
        **query,
        "status": "Delivered",
        "created_date": {"$gte": today}
    })
    pending_pickup = shipments_collection.count_documents({**query, "status": "Created"})
    
    return {
        "total_shipments": total_shipments,
        "in_transit": in_transit,
        "delivered_today": delivered_today,
        "pending_pickup": pending_pickup
    }

@app.put("/api/offices/{office_id}", response_model=OfficeResponse)
async def update_office(office_id: str, office: OfficeCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        result = offices_collection.update_one(
            {"_id": ObjectId(office_id)},
            {"$set": {
                "name": office.name,
                "address": office.address
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Office not found")
        updated = offices_collection.find_one({"_id": ObjectId(office_id)})
        office_dict = {**updated, "id": str(updated["_id"])}
        office_dict.pop("_id", None)
        return OfficeResponse(**office_dict)
    except:
        raise HTTPException(status_code=400, detail="Invalid office ID")

@app.delete("/api/offices/{office_id}")
async def delete_office(office_id: str, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        result = offices_collection.delete_one({"_id": ObjectId(office_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Office not found")
        return {"message": "Office deleted successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid office ID")

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        updated = users_collection.find_one({"_id": ObjectId(user_id)})
        user_dict = {**updated, "id": str(updated["_id"])}
        user_dict.pop("_id", None)
        user_dict.pop("password_hash", None)
        return UserResponse(**user_dict)
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    try:
        result = users_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deleted successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@app.put("/api/shipments/{tracking_number}/status")
async def update_shipment_status(
    tracking_number: str,
    status_update: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update shipment status (for Drivers)"""
    if current_user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can update shipment status")
    
    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    valid_statuses = ["Created", "PickedUp", "InTransit", "Delivered", "Returned"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    shipment = shipments_collection.find_one({"tracking_number": tracking_number})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Update status
    shipments_collection.update_one(
        {"tracking_number": tracking_number},
        {"$set": {"status": new_status}}
    )
    
    # Create event
    event_dict = {
        "tracking_number": tracking_number,
        "event_type": new_status,
        "description": f"Status updated to {new_status} by {current_user.full_name}",
        "timestamp": datetime.utcnow()
    }
    events_collection.insert_one(event_dict)
    
    return {"message": "Status updated successfully", "status": new_status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

