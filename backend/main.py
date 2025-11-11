from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import os
import bcrypt
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Optional import for route optimization (install ortools if needed)
try:
    from services.route_optimizer import optimize_route
    ROUTE_OPTIMIZATION_AVAILABLE = True
except ImportError:
    ROUTE_OPTIMIZATION_AVAILABLE = False
    print("Warning: Route optimization not available. Install ortools to enable route optimization.")
    
    # Provide a fallback function
    def optimize_route(offices: List[Dict], shipments: Optional[List[Dict]] = None) -> Dict:
        """Fallback route optimization when ortools is not available"""
        if len(offices) < 2:
            return {
                "waypoints": [offices[0]["id"]] if offices else [],
                "estimated_duration": 0,
                "distance": 0
            }
        # Return offices in original order
        return {
            "waypoints": [office["id"] for office in offices],
            "estimated_duration": len(offices) * 15,  # Rough estimate: 15 min per stop
            "distance": 0
        }

load_dotenv()

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:password123@localhost:27017/intership?authSource=admin")
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)
EMAIL_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)

# Database
client = MongoClient(MONGODB_URL)
db = client.intership
users_collection = db.users
offices_collection = db.offices
shipments_collection = db.shipments
events_collection = db.shipment_events
nfc_tags_collection = db.nfc_tags
nfc_scans_collection = db.nfc_scans
notification_preferences_collection = db.notification_preferences
routes_collection = db.routes
route_stops_collection = db.route_stops
route_assignments_collection = db.route_assignments
proof_of_delivery_collection = db.proof_of_delivery
audit_logs_collection = db.audit_logs

# Security - Use bcrypt directly to avoid passlib issues
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# FastAPI app
app = FastAPI(title="OATH Logistics API", version="1.0.0")

# CORS - Support both localhost and IP addresses
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

# Temporarily allow all origins for debugging Cloudflare tunnel issues
# TODO: Restrict to specific origins in production
allow_all_origins = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"

# Log CORS origins for debugging
print(f"CORS Origins configured: {cors_origins}")
print(f"CORS Allow All Origins: {allow_all_origins}")

# Note: Can't use allow_origins=["*"] with allow_credentials=True
# So we'll allow all origins by using allow_origin_regex when needed
if allow_all_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins if cors_origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "Sender"
    email: Optional[EmailStr] = None  # Optional, for notifications
    id_number: Optional[str] = None  # Optional, required for PIN login
    pin: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    id_number: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "Sender"
    is_active: bool = True
    id_number: Optional[str] = None

class UserInDB(UserResponse):
    password_hash: str
    pin_hash: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    id_number: Optional[str] = None

class UsernameLoginRequest(BaseModel):
    username: str
    password: str

class IDPINLoginRequest(BaseModel):
    id_number: str
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
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    nfc_scan_required: Optional[bool] = False
    nfc_tag_id: Optional[str] = None
    nfc_scan_timestamp: Optional[datetime] = None
    assigned_route_id: Optional[str] = None
    route_stop_sequence: Optional[int] = None
    proof_of_delivery_id: Optional[str] = None

# NFC Models
class NFCTagCreate(BaseModel):
    tag_id: str
    office_id: str
    location_name: str
    coordinates: Optional[dict] = None  # {lat, lng}
    is_active: bool = True

class NFCTagResponse(BaseModel):
    id: str
    tag_id: str
    office_id: str
    office_name: Optional[str] = None
    location_name: str
    coordinates: Optional[dict] = None
    is_active: bool
    created_date: datetime

class NFCScanRequest(BaseModel):
    tag_id: str
    coordinates: Optional[dict] = None  # {lat, lng}

class NFCScanResponse(BaseModel):
    id: str
    tag_id: str
    driver_id: str
    driver_name: Optional[str] = None
    scan_timestamp: datetime
    location_coordinates: Optional[dict] = None
    location_name: Optional[str] = None
    expires_at: datetime  # 30 minutes from scan

# Notification Preferences Models
class NotificationPreferencesCreate(BaseModel):
    notify_on_nfc_scan: bool = False
    notify_on_delivery: bool = True
    notification_methods: List[str] = ["email"]  # ["email", "sms"]
    phone_number: Optional[str] = None

class NotificationPreferencesResponse(BaseModel):
    user_id: str
    notify_on_nfc_scan: bool
    notify_on_delivery: bool
    notification_methods: List[str]
    phone_number: Optional[str] = None

# Route Models
class RouteStopCreate(BaseModel):
    office_id: str
    nfc_tag_id: Optional[str] = None
    shipment_tracking_numbers: List[str] = []
    stop_sequence: int

class RouteCreate(BaseModel):
    route_name: str
    shipment_tracking_numbers: List[str]
    driver_id: str
    route_date: datetime

class RouteResponse(BaseModel):
    id: str
    route_name: str
    assigned_driver_id: str
    assigned_driver_name: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    route_date: datetime
    status: str  # Planned, InProgress, Completed, Cancelled
    optimized_waypoints: Optional[List[dict]] = None
    estimated_duration: Optional[int] = None  # minutes
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None

class RouteStopResponse(BaseModel):
    id: str
    route_id: str
    stop_sequence: int
    office_id: str
    office_name: Optional[str] = None
    nfc_tag_id: Optional[str] = None
    shipment_tracking_numbers: List[str]
    estimated_arrival: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    stop_status: str  # Pending, InProgress, Completed, Skipped

# Proof of Delivery Models
class ProofOfDeliveryCreate(BaseModel):
    recipient_name: str
    signature: str  # base64 image or SVG path
    photo: Optional[str] = None  # base64 image
    notes: Optional[str] = None
    coordinates: Optional[dict] = None  # {lat, lng}

class ProofOfDeliveryResponse(BaseModel):
    id: str
    tracking_number: str
    driver_id: str
    driver_name: Optional[str] = None
    recipient_name: str
    delivery_signature: str
    delivery_photo: Optional[str] = None
    delivery_timestamp: datetime
    delivery_location: Optional[dict] = None
    notes: Optional[str] = None

# Audit Log Models
class AuditLogResponse(BaseModel):
    id: str
    action: str
    user_id: str
    user_name: Optional[str] = None
    entity_type: str
    entity_id: str
    changes: Optional[dict] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

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

def populate_sender_info(shipment_dict: dict) -> dict:
    """Add sender_name and sender_email to shipment dictionary"""
    sender_id = shipment_dict.get("sender_id")
    if sender_id:
        try:
            sender = users_collection.find_one({"_id": ObjectId(sender_id)})
            if sender:
                shipment_dict["sender_name"] = sender.get("full_name") or sender.get("username") or ""
                shipment_dict["sender_email"] = sender.get("email") or ""
            else:
                shipment_dict["sender_name"] = None
                shipment_dict["sender_email"] = None
        except:
            shipment_dict["sender_name"] = None
            shipment_dict["sender_email"] = None
    else:
        shipment_dict["sender_name"] = None
        shipment_dict["sender_email"] = None
    return shipment_dict

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

def log_audit_event(
    action: str,
    user_id: str,
    entity_type: str,
    entity_id: str,
    changes: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log an audit event"""
    try:
        audit_dict = {
            "action": action,
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "changes": changes or {},
            "timestamp": datetime.utcnow(),
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        audit_logs_collection.insert_one(audit_dict)
    except Exception as e:
        print(f"Failed to log audit event: {e}")
        # Don't fail the request if audit logging fails

def get_notification_preferences(user_id: str) -> dict:
    """Get notification preferences for a user, creating defaults if not exists"""
    prefs = notification_preferences_collection.find_one({"user_id": user_id})
    if not prefs:
        # Create default preferences
        default_prefs = {
            "user_id": user_id,
            "notify_on_nfc_scan": False,
            "notify_on_delivery": True,
            "notification_methods": ["email"],
            "phone_number": None
        }
        notification_preferences_collection.insert_one(default_prefs)
        return default_prefs
    return prefs

def send_nfc_scan_notification(tag_id: str, driver_id: str, location_name: str, coordinates: Optional[dict] = None):
    """Send notifications to supervisors/admins when NFC tag is scanned"""
    try:
        # Get NFC tag info
        nfc_tag = nfc_tags_collection.find_one({"tag_id": tag_id})
        if not nfc_tag:
            return False
        
        # Get driver info
        driver = users_collection.find_one({"_id": ObjectId(driver_id)})
        driver_name = driver.get("full_name") or driver.get("username") or "Driver" if driver else "Driver"
        
        # Get office info
        office = offices_collection.find_one({"_id": ObjectId(nfc_tag["office_id"])})
        office_name = office.get("name") if office else "Unknown Office"
        
        # Get available packages at this location
        available_packages = list(shipments_collection.find({
            "nfc_tag_id": tag_id,
            "status": {"$in": ["Created", "PickedUp"]}
        }).limit(10))
        
        package_list = ", ".join([pkg.get("tracking_number", "") for pkg in available_packages[:5]])
        if len(available_packages) > 5:
            package_list += f" and {len(available_packages) - 5} more"
        
        # Find all supervisors and admins with NFC scan notifications enabled
        supervisors = list(users_collection.find({
            "role": {"$in": ["Supervisor", "Admin"]},
            "is_active": True
        }))
        
        notified_count = 0
        for supervisor in supervisors:
            prefs = get_notification_preferences(str(supervisor["_id"]))
            if prefs.get("notify_on_nfc_scan", False):
                # Send email
                if "email" in prefs.get("notification_methods", []) and supervisor.get("email"):
                    try:
                        subject = f"NFC Scan Alert: {driver_name} scanned tag at {location_name}"
                        body = f"""
                        <h2>NFC Tag Scanned</h2>
                        <p><strong>Driver:</strong> {driver_name}</p>
                        <p><strong>Location:</strong> {location_name} ({office_name})</p>
                        <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                        {"<p><strong>Available Packages:</strong> " + package_list + "</p>" if package_list else ""}
                        <p>The driver can now scan packages at this location.</p>
                        """
                        send_email(supervisor["email"], subject, body)
                        notified_count += 1
                    except Exception as e:
                        print(f"Failed to send email notification: {e}")
                
                # Send SMS (if implemented)
                if "sms" in prefs.get("notification_methods", []) and prefs.get("phone_number"):
                    # TODO: Implement SMS sending
                    pass
        
        return notified_count > 0
    except Exception as e:
        print(f"Failed to send NFC scan notifications: {e}")
        return False

def send_email(to_email: str, subject: str, body: str, is_html: bool = True):
    """Send an email notification"""
    if not EMAIL_ENABLED:
        print(f"Email disabled. Would send to {to_email}: {subject}")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        
        if is_html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        identifier: str = payload.get("sub")
        identifier_type: str = payload.get("type", "username")  # "username", "email", or "id_number"
        
        if identifier is None:
            raise credentials_exception
        
        # Look up user by username, email, or id_number depending on token type
        if identifier_type == "id_number":
            user = users_collection.find_one({"id_number": identifier})
        elif identifier_type == "email":
            user = users_collection.find_one({"email": identifier})
        else:
            # Try username first, then email as fallback
            user = users_collection.find_one({"username": identifier})
            if not user:
                user = users_collection.find_one({"email": identifier})
        
        if user is None:
            raise credentials_exception
        user_dict = {**user, "id": str(user["_id"])}
        # Ensure pin_hash is present (even if None)
        if "pin_hash" not in user_dict:
            user_dict["pin_hash"] = None
        # Ensure fields are present for backward compatibility
        if "username" not in user_dict:
            user_dict["username"] = ""
        if "id_number" not in user_dict:
            user_dict["id_number"] = None
        if "email" not in user_dict:
            user_dict["email"] = None
        return UserInDB(**user_dict)
    except JWTError:
        raise credentials_exception

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    # ID numbers can only be set by admins, not during registration
    if user.id_number:
        raise HTTPException(status_code=400, detail="ID numbers cannot be set during registration. Please contact an administrator.")
    
    # PINs require ID numbers, so they cannot be set during registration
    if user.pin:
        raise HTTPException(status_code=400, detail="PINs cannot be set during registration. ID numbers must be assigned by an administrator first.")
    
    # Validate username format (alphanumeric, underscore, hyphen)
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', user.username):
        raise HTTPException(status_code=400, detail="Username must contain only letters, numbers, underscores, and hyphens")
    
    # Check if username exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check if email exists (if provided)
    if user.email:
        existing_email = users_collection.find_one({"email": user.email})
        if existing_email and existing_email.get("username") != user.username:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (ID numbers will be set by admins later)
    user_dict = {
        "username": user.username,
        "password_hash": get_password_hash(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "is_active": True,
        "created_date": datetime.utcnow()
    }
    
    # Add optional fields
    if user.email:
        user_dict["email"] = user.email
    
    result = users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    user_dict.pop("_id", None)
    user_dict.pop("password_hash", None)
    user_dict.pop("pin_hash", None)
    return UserResponse(**user_dict)

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: UsernameLoginRequest):
    # Try to find user by username first, then by email if username not found
    user = users_collection.find_one({"username": login_data.username})
    if not user:
        # If not found by username, try email
        user = users_collection.find_one({"email": login_data.username})
    
    # If still not found or password doesn't match
    if not user or not verify_password(login_data.password, user.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Use username for token if available, otherwise use email
    token_identifier = user.get("username") or user.get("email")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": token_identifier, "type": "username" if user.get("username") else "email"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login-pin", response_model=Token)
async def login_pin(login_data: IDPINLoginRequest):
    # Trim and validate inputs
    id_number = login_data.id_number.strip()
    pin = login_data.pin.strip()
    
    # Validate PIN length
    if len(pin) < 4 or len(pin) > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be 4-8 digits",
        )
    
    # Find user by ID number
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        print(f"Login PIN: User not found with ID number: {id_number}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID number or PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user has a PIN set
    if not user.get("pin_hash"):
        print(f"Login PIN: User {id_number} does not have a PIN set")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN not set for this user. Please use username/password login or set a PIN first.",
        )
    
    # Verify PIN
    pin_valid = verify_pin(pin, user["pin_hash"])
    if not pin_valid:
        print(f"Login PIN: PIN verification failed for user {id_number}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID number or PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Login PIN: Successfully authenticated user {id_number}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id_number"], "type": "id_number"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class PINUpdateRequest(BaseModel):
    pin: str

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

@app.put("/api/auth/pin", response_model=dict)
async def update_pin(
    pin_data: PINUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Set or update user's PIN"""
    # Trim and validate PIN
    pin = pin_data.pin.strip()
    
    # Validate PIN (4-8 digits)
    if not pin.isdigit() or len(pin) < 4 or len(pin) > 8:
        raise HTTPException(status_code=400, detail="PIN must be 4-8 digits")
    
    # Require an ID number so the user can login using ID + PIN later
    if not current_user.id_number:
        raise HTTPException(status_code=400, detail="You must have an ID number before setting a PIN. Please contact an administrator to assign one.")

    # Update user's PIN hash by id_number
    pin_hash = get_pin_hash(pin)
    result = users_collection.update_one(
        {"id_number": current_user.id_number},
        {"$set": {"pin_hash": pin_hash}}
    )
    if result.matched_count == 0:
        print(f"Update PIN: User not found with ID number: {current_user.id_number}")
        raise HTTPException(status_code=404, detail="User with this ID number not found")
    
    print(f"Update PIN: Successfully updated PIN for user {current_user.id_number}")
    return {"message": "PIN updated successfully"}

@app.put("/api/auth/password", response_model=dict)
async def update_password(
    password_data: PasswordUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user's password"""
    # Get user from database - find by username or id_number
    if current_user.username:
        user = users_collection.find_one({"username": current_user.username})
    elif current_user.id_number:
        user = users_collection.find_one({"id_number": current_user.id_number})
    else:
        raise HTTPException(status_code=400, detail="Unable to identify user")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Validate new password (basic check - can be enhanced)
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password hash - update by username or id_number
    if current_user.username:
        users_collection.update_one(
            {"username": current_user.username},
            {"$set": {"password_hash": get_password_hash(password_data.new_password)}}
        )
    elif current_user.id_number:
        users_collection.update_one(
            {"id_number": current_user.id_number},
            {"$set": {"password_hash": get_password_hash(password_data.new_password)}}
        )
    
    return {"message": "Password updated successfully"}

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
    shipment_dict = populate_sender_info(shipment_dict)
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
        s_dict = populate_sender_info(s_dict)
        result.append(ShipmentResponse(**s_dict))
    return result


@app.get("/api/shipments", response_model=List[ShipmentResponse])
async def list_shipments(
    status: Optional[str] = None,
    office_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {}
    
    # Filter by role
    if current_user.role == "Sender":
        # Senders can only see their own shipments
        query["sender_id"] = str(current_user.id)
    elif current_user.role == "Driver":
        # Drivers can see all shipments - allow them to view and share entire workload
        # Filter by status if specified (empty string means show all)
        if status:
            query["status"] = status
        if office_id:
            query["destination_office_id"] = office_id
        # If no status filter, show all shipments (drivers can see everything for workload sharing)
    # Admins can see all shipments
    
    if status and current_user.role != "Driver":
        query["status"] = status
    if office_id and current_user.role != "Driver":
        query["destination_office_id"] = office_id
    
    # Search filter (search in tracking number, recipient name, destination office name)
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_query = {
            "$or": [
                {"tracking_number": search_regex},
                {"recipient_name": search_regex},
                {"destination_office_name": search_regex}
            ]
        }
        # Merge search query with existing query
        if query:
            # If we already have conditions, combine them with $and
            query = {"$and": [query, search_query]}
        else:
            query = search_query
    
    shipments = list(shipments_collection.find(query).sort("created_date", -1))
    result = []
    for s in shipments:
        s_dict = {**s, "id": str(s["_id"])}
        s_dict.pop("_id", None)
        s_dict = populate_sender_info(s_dict)
        result.append(ShipmentResponse(**s_dict))
    return result

@app.get("/api/shipments/{tracking_number}", response_model=ShipmentResponse)
async def get_shipment(tracking_number: str):
    shipment = shipments_collection.find_one({"tracking_number": tracking_number})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    shipment_dict = {**shipment, "id": str(shipment["_id"])}
    shipment_dict.pop("_id", None)
    shipment_dict = populate_sender_info(shipment_dict)
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
        u_dict.pop("pin_hash", None)
        # Ensure all required fields have default values if missing
        if "username" not in u_dict:
            u_dict["username"] = None
        if "full_name" not in u_dict:
            u_dict["full_name"] = None
        if "role" not in u_dict:
            u_dict["role"] = "Sender"
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
        # Drivers can see all shipments for workload sharing
        # Only filter by office if specified
        if office_id:
            query["destination_office_id"] = office_id
        # No status restriction - drivers can see everything
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
        # Check if ID number is being updated and if it's already in use by another user
        if user_update.id_number is not None:
            existing_user = users_collection.find_one({"id_number": user_update.id_number})
            if existing_user and str(existing_user["_id"]) != user_id:
                raise HTTPException(status_code=400, detail="ID number already assigned to another user")
        
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        # Handle empty string as None for id_number (to clear it)
        if "id_number" in update_data and update_data["id_number"] == "":
            update_data["id_number"] = None
        
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

def send_delivery_email(sender_email: str, sender_name: str, tracking_number: str, recipient_name: str, delivery_time: datetime):
    """Send email notification when shipment is delivered"""
    subject = f"📦 Package Delivered - {tracking_number}"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">✅ Package Delivered Successfully!</h2>
          <p>Dear {sender_name},</p>
          <p>Your package has been delivered successfully.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> {tracking_number}</p>
            <p style="margin: 5px 0;"><strong>Recipient:</strong> {recipient_name}</p>
            <p style="margin: 5px 0;"><strong>Delivery Time:</strong> {delivery_time.strftime('%B %d, %Y at %I:%M %p UTC')}</p>
          </div>
          <p>Thank you for using OATH Logistics!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated notification from OATH Logistics tracking system.</p>
        </div>
      </body>
    </html>
    """
    return send_email(sender_email, subject, body)

@app.put("/api/shipments/{tracking_number}/status")
async def update_shipment_status(
    tracking_number: str,
    status_update: dict,
    current_user: UserInDB = Depends(get_current_user),
    request: Request = None
):
    """Update shipment status (for Drivers)"""
    if current_user.role != "Driver" and current_user.role != "Admin" and current_user.role != "Supervisor":
        raise HTTPException(status_code=403, detail="Only drivers, supervisors, and admins can update shipment status")
    
    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    valid_statuses = ["Created", "PickedUp", "InTransit", "Delivered", "Returned"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    shipment = shipments_collection.find_one({"tracking_number": tracking_number})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Policy enforcement: Check if NFC scan is required
    if shipment.get("nfc_scan_required") and shipment.get("nfc_tag_id"):
        if current_user.role == "Driver":  # Admins/Supervisors can override
            # Check if driver has scanned the required NFC tag within last 30 minutes
            required_tag_id = shipment["nfc_tag_id"]
            thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
            
            recent_scan = nfc_scans_collection.find_one({
                "tag_id": required_tag_id,
                "driver_id": str(current_user.id),
                "scan_timestamp": {"$gte": thirty_min_ago}
            })
            
            if not recent_scan:
                raise HTTPException(
                    status_code=403,
                    detail="Please scan NFC tag at pickup location first. Package scanning is disabled until NFC tag is scanned."
                )
    
    # Update status
    delivery_time = datetime.utcnow()
    old_status = shipment.get("status")
    shipments_collection.update_one(
        {"tracking_number": tracking_number},
        {"$set": {"status": new_status, "last_updated": delivery_time}}
    )
    
    # Create event
    event_dict = {
        "tracking_number": tracking_number,
        "event_type": new_status,
        "description": f"Status updated to {new_status} by {current_user.full_name or current_user.username or 'Driver'}",
        "timestamp": delivery_time,
        "updated_by": str(current_user.id)
    }
    events_collection.insert_one(event_dict)
    
    # Log audit event
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    log_audit_event(
        action="STATUS_UPDATED",
        user_id=str(current_user.id),
        entity_type="shipment",
        entity_id=tracking_number,
        changes={"status": {"old": old_status, "new": new_status}},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # Send email notification if delivered
    if new_status == "Delivered":
        # Get sender information
        try:
            sender = users_collection.find_one({"_id": ObjectId(shipment["sender_id"])})
            if sender and sender.get("email"):
                send_delivery_email(
                    sender_email=sender["email"],
                    sender_name=sender.get("full_name", sender.get("username", "User")),
                    tracking_number=tracking_number,
                    recipient_name=shipment["recipient_name"],
                    delivery_time=delivery_time
                )
        except Exception as e:
            print(f"Failed to send delivery notification: {e}")
            # Don't fail the request if email fails
    
    return {"message": "Status updated successfully", "status": new_status}

# NFC Tag Management Endpoints
@app.post("/api/nfc-tags", response_model=NFCTagResponse)
async def create_nfc_tag(
    tag: NFCTagCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create NFC tag (Admin/Supervisor only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    # Check if tag_id already exists
    existing = nfc_tags_collection.find_one({"tag_id": tag.tag_id})
    if existing:
        raise HTTPException(status_code=400, detail="NFC tag ID already exists")
    
    # Verify office exists
    office = offices_collection.find_one({"_id": ObjectId(tag.office_id)})
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    tag_dict = {
        "tag_id": tag.tag_id,
        "office_id": tag.office_id,
        "location_name": tag.location_name,
        "coordinates": tag.coordinates,
        "is_active": tag.is_active,
        "created_date": datetime.utcnow()
    }
    
    result = nfc_tags_collection.insert_one(tag_dict)
    tag_dict["id"] = str(result.inserted_id)
    tag_dict["office_name"] = office.get("name")
    tag_dict.pop("_id", None)
    
    log_audit_event(
        action="NFC_TAG_CREATED",
        user_id=str(current_user.id),
        entity_type="nfc_tag",
        entity_id=tag.tag_id
    )
    
    return NFCTagResponse(**tag_dict)

@app.get("/api/nfc-tags", response_model=List[NFCTagResponse])
async def list_nfc_tags(
    office_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """List NFC tags (filtered by office if Driver)"""
    query = {}
    if office_id:
        query["office_id"] = office_id
    elif current_user.role == "Driver":
        # Drivers see tags for offices they have shipments for
        # For now, show all active tags
        query["is_active"] = True
    
    tags = list(nfc_tags_collection.find(query).sort("created_date", -1))
    result = []
    for tag in tags:
        tag_dict = {**tag, "id": str(tag["_id"])}
        tag_dict.pop("_id", None)
        
        # Get office name
        office = offices_collection.find_one({"_id": ObjectId(tag["office_id"])})
        if office:
            tag_dict["office_name"] = office.get("name")
        
        result.append(NFCTagResponse(**tag_dict))
    return result

@app.get("/api/nfc-tags/{tag_id}", response_model=NFCTagResponse)
async def get_nfc_tag(tag_id: str):
    """Get NFC tag details"""
    tag = nfc_tags_collection.find_one({"tag_id": tag_id})
    if not tag:
        raise HTTPException(status_code=404, detail="NFC tag not found")
    
    tag_dict = {**tag, "id": str(tag["_id"])}
    tag_dict.pop("_id", None)
    
    # Get office name
    office = offices_collection.find_one({"_id": ObjectId(tag["office_id"])})
    if office:
        tag_dict["office_name"] = office.get("name")
    
    return NFCTagResponse(**tag_dict)

@app.put("/api/nfc-tags/{tag_id}", response_model=NFCTagResponse)
async def update_nfc_tag(
    tag_id: str,
    tag_update: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update NFC tag (Admin/Supervisor only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    tag = nfc_tags_collection.find_one({"tag_id": tag_id})
    if not tag:
        raise HTTPException(status_code=404, detail="NFC tag not found")
    
    update_data = {k: v for k, v in tag_update.items() if v is not None}
    if update_data:
        nfc_tags_collection.update_one(
            {"tag_id": tag_id},
            {"$set": update_data}
        )
    
    updated = nfc_tags_collection.find_one({"tag_id": tag_id})
    tag_dict = {**updated, "id": str(updated["_id"])}
    tag_dict.pop("_id", None)
    
    # Get office name
    office = offices_collection.find_one({"_id": ObjectId(updated["office_id"])})
    if office:
        tag_dict["office_name"] = office.get("name")
    
    log_audit_event(
        action="NFC_TAG_UPDATED",
        user_id=str(current_user.id),
        entity_type="nfc_tag",
        entity_id=tag_id,
        changes=update_data
    )
    
    return NFCTagResponse(**tag_dict)

@app.delete("/api/nfc-tags/{tag_id}")
async def delete_nfc_tag(
    tag_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete NFC tag (Admin/Supervisor only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    result = nfc_tags_collection.delete_one({"tag_id": tag_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="NFC tag not found")
    
    log_audit_event(
        action="NFC_TAG_DELETED",
        user_id=str(current_user.id),
        entity_type="nfc_tag",
        entity_id=tag_id
    )
    
    return {"message": "NFC tag deleted successfully"}

# NFC Scanning Endpoint
@app.post("/api/nfc/scan", response_model=NFCScanResponse)
async def scan_nfc_tag(
    scan_request: NFCScanRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Driver scans NFC tag"""
    if current_user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can scan NFC tags")
    
    # Verify tag exists and is active
    nfc_tag = nfc_tags_collection.find_one({"tag_id": scan_request.tag_id})
    if not nfc_tag:
        raise HTTPException(status_code=404, detail="NFC tag not found")
    
    if not nfc_tag.get("is_active", True):
        raise HTTPException(status_code=400, detail="NFC tag is inactive")
    
    # Record scan
    scan_timestamp = datetime.utcnow()
    expires_at = scan_timestamp + timedelta(minutes=30)
    
    scan_dict = {
        "tag_id": scan_request.tag_id,
        "driver_id": str(current_user.id),
        "scan_timestamp": scan_timestamp,
        "location_coordinates": scan_request.coordinates,
        "shipment_tracking_numbers": []  # Will be updated when packages are scanned
    }
    
    result = nfc_scans_collection.insert_one(scan_dict)
    scan_dict["id"] = str(result.inserted_id)
    scan_dict["driver_name"] = current_user.full_name or current_user.username
    scan_dict["location_name"] = nfc_tag.get("location_name")
    scan_dict["expires_at"] = expires_at
    
    # Send notifications to supervisors/admins
    send_nfc_scan_notification(
        tag_id=scan_request.tag_id,
        driver_id=str(current_user.id),
        location_name=nfc_tag.get("location_name"),
        coordinates=scan_request.coordinates
    )
    
    # Log audit event
    log_audit_event(
        action="NFC_SCAN",
        user_id=str(current_user.id),
        entity_type="nfc_tag",
        entity_id=scan_request.tag_id,
        changes={"scan_timestamp": scan_timestamp.isoformat()}
    )
    
    return NFCScanResponse(**scan_dict)

# Notification Preferences Endpoints
@app.get("/api/users/me/notification-preferences", response_model=NotificationPreferencesResponse)
async def get_my_notification_preferences(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's notification preferences"""
    prefs = get_notification_preferences(str(current_user.id))
    return NotificationPreferencesResponse(**prefs)

@app.put("/api/users/me/notification-preferences", response_model=NotificationPreferencesResponse)
async def update_my_notification_preferences(
    preferences: NotificationPreferencesCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update current user's notification preferences"""
    prefs_dict = preferences.dict()
    prefs_dict["user_id"] = str(current_user.id)
    
    # Update or insert
    notification_preferences_collection.update_one(
        {"user_id": str(current_user.id)},
        {"$set": prefs_dict},
        upsert=True
    )
    
    return NotificationPreferencesResponse(**prefs_dict)

@app.get("/api/users/{user_id}/notification-preferences", response_model=NotificationPreferencesResponse)
async def get_user_notification_preferences(
    user_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's notification preferences (Admin/Supervisor only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    prefs = get_notification_preferences(user_id)
    return NotificationPreferencesResponse(**prefs)

# Route Management Endpoints
@app.post("/api/routes", response_model=RouteResponse)
async def create_route(
    route: RouteCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create route (Supervisor/Admin only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    # Verify driver exists
    driver = users_collection.find_one({"_id": ObjectId(route.driver_id)})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.get("role") != "Driver":
        raise HTTPException(status_code=400, detail="User must be a Driver")
    
    # Get shipments and their offices
    shipments = list(shipments_collection.find({
        "tracking_number": {"$in": route.shipment_tracking_numbers}
    }))
    
    if len(shipments) == 0:
        raise HTTPException(status_code=400, detail="No shipments found")
    
    # Group shipments by office
    office_shipments: Dict[str, List[str]] = {}
    for shipment in shipments:
        office_id = shipment.get("destination_office_id")
        if office_id:
            if office_id not in office_shipments:
                office_shipments[office_id] = []
            office_shipments[office_id].append(shipment.get("tracking_number"))
    
    # Get office details with coordinates
    offices_list = []
    for office_id in office_shipments.keys():
        office = offices_collection.find_one({"_id": ObjectId(office_id)})
        if office:
            offices_list.append({
                "id": office_id,
                "name": office.get("name"),
                "coordinates": office.get("coordinates")  # Should be added to offices
            })
    
    # Optimize route
    optimized_result = optimize_route(offices_list, shipments)
    
    # Create route
    route_dict = {
        "route_name": route.route_name,
        "assigned_driver_id": route.driver_id,
        "supervisor_id": str(current_user.id),
        "route_date": route.route_date,
        "status": "Planned",
        "optimized_waypoints": optimized_result.get("waypoints", []),
        "estimated_duration": optimized_result.get("estimated_duration", 0),
        "actual_start_time": None,
        "actual_end_time": None,
        "created_date": datetime.utcnow()
    }
    
    result = routes_collection.insert_one(route_dict)
    route_id = str(result.inserted_id)
    
    # Create route stops
    stop_sequence = 0
    for office_id in optimized_result.get("waypoints", []):
        if office_id in office_shipments:
            stop_dict = {
                "route_id": route_id,
                "stop_sequence": stop_sequence,
                "office_id": office_id,
                "nfc_tag_id": None,  # Can be set later
                "shipment_tracking_numbers": office_shipments[office_id],
                "estimated_arrival": None,
                "actual_arrival": None,
                "stop_status": "Pending"
            }
            route_stops_collection.insert_one(stop_dict)
            
            # Update shipments with route info
            for tracking_num in office_shipments[office_id]:
                shipments_collection.update_one(
                    {"tracking_number": tracking_num},
                    {"$set": {
                        "assigned_route_id": route_id,
                        "route_stop_sequence": stop_sequence
                    }}
                )
            
            stop_sequence += 1
    
    # Create route assignment
    assignment_dict = {
        "route_id": route_id,
        "driver_id": route.driver_id,
        "assigned_by": str(current_user.id),
        "assigned_date": datetime.utcnow(),
        "status": "Assigned"
    }
    route_assignments_collection.insert_one(assignment_dict)
    
    # Populate response
    route_dict["id"] = route_id
    route_dict["assigned_driver_name"] = driver.get("full_name") or driver.get("username")
    route_dict["supervisor_name"] = current_user.full_name or current_user.username
    route_dict.pop("_id", None)
    
    log_audit_event(
        action="ROUTE_CREATED",
        user_id=str(current_user.id),
        entity_type="route",
        entity_id=route_id
    )
    
    return RouteResponse(**route_dict)

@app.get("/api/routes", response_model=List[RouteResponse])
async def list_routes(
    status: Optional[str] = None,
    driver_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """List routes (filtered by role)"""
    query = {}
    
    if current_user.role == "Driver":
        query["assigned_driver_id"] = str(current_user.id)
    elif current_user.role == "Supervisor":
        # Supervisors see routes they created or all routes
        query["$or"] = [
            {"supervisor_id": str(current_user.id)},
            {"supervisor_id": {"$exists": True}}  # All routes
        ]
    # Admins see all routes (no filter)
    
    if status:
        query["status"] = status
    if driver_id and current_user.role in ["Admin", "Supervisor"]:
        query["assigned_driver_id"] = driver_id
    
    routes = list(routes_collection.find(query).sort("route_date", -1))
    result = []
    for route in routes:
        route_dict = {**route, "id": str(route["_id"])}
        route_dict.pop("_id", None)
        
        # Get driver name
        driver = users_collection.find_one({"_id": ObjectId(route["assigned_driver_id"])})
        if driver:
            route_dict["assigned_driver_name"] = driver.get("full_name") or driver.get("username")
        
        # Get supervisor name
        if route.get("supervisor_id"):
            supervisor = users_collection.find_one({"_id": ObjectId(route["supervisor_id"])})
            if supervisor:
                route_dict["supervisor_name"] = supervisor.get("full_name") or supervisor.get("username")
        
        result.append(RouteResponse(**route_dict))
    return result

@app.get("/api/routes/{route_id}", response_model=RouteResponse)
async def get_route(
    route_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get route details"""
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Check access
    if current_user.role == "Driver" and route.get("assigned_driver_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    route_dict = {**route, "id": str(route["_id"])}
    route_dict.pop("_id", None)
    
    # Get driver and supervisor names
    driver = users_collection.find_one({"_id": ObjectId(route["assigned_driver_id"])})
    if driver:
        route_dict["assigned_driver_name"] = driver.get("full_name") or driver.get("username")
    
    if route.get("supervisor_id"):
        supervisor = users_collection.find_one({"_id": ObjectId(route["supervisor_id"])})
        if supervisor:
            route_dict["supervisor_name"] = supervisor.get("full_name") or supervisor.get("username")
    
    return RouteResponse(**route_dict)

@app.get("/api/routes/{route_id}/stops", response_model=List[RouteStopResponse])
async def get_route_stops(
    route_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get route stops"""
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Check access
    if current_user.role == "Driver" and route.get("assigned_driver_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    stops = list(route_stops_collection.find({"route_id": route_id}).sort("stop_sequence", 1))
    result = []
    for stop in stops:
        stop_dict = {**stop, "id": str(stop["_id"])}
        stop_dict.pop("_id", None)
        
        # Get office name
        office = offices_collection.find_one({"_id": ObjectId(stop["office_id"])})
        if office:
            stop_dict["office_name"] = office.get("name")
        
        result.append(RouteStopResponse(**stop_dict))
    return result

@app.put("/api/routes/{route_id}", response_model=RouteResponse)
async def update_route(
    route_id: str,
    route_update: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update route (Supervisor/Admin only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    update_data = {k: v for k, v in route_update.items() if v is not None}
    if update_data:
        routes_collection.update_one(
            {"_id": ObjectId(route_id)},
            {"$set": update_data}
        )
    
    updated = routes_collection.find_one({"_id": ObjectId(route_id)})
    route_dict = {**updated, "id": str(updated["_id"])}
    route_dict.pop("_id", None)
    
    # Get driver and supervisor names
    driver = users_collection.find_one({"_id": ObjectId(updated["assigned_driver_id"])})
    if driver:
        route_dict["assigned_driver_name"] = driver.get("full_name") or driver.get("username")
    
    if updated.get("supervisor_id"):
        supervisor = users_collection.find_one({"_id": ObjectId(updated["supervisor_id"])})
        if supervisor:
            route_dict["supervisor_name"] = supervisor.get("full_name") or supervisor.get("username")
    
    log_audit_event(
        action="ROUTE_UPDATED",
        user_id=str(current_user.id),
        entity_type="route",
        entity_id=route_id,
        changes=update_data
    )
    
    return RouteResponse(**route_dict)

@app.delete("/api/routes/{route_id}")
async def delete_route(
    route_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Cancel/delete route (Supervisor/Admin only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Update route status to Cancelled instead of deleting
    routes_collection.update_one(
        {"_id": ObjectId(route_id)},
        {"$set": {"status": "Cancelled"}}
    )
    
    # Remove route assignments from shipments
    shipments_collection.update_many(
        {"assigned_route_id": route_id},
        {"$unset": {"assigned_route_id": "", "route_stop_sequence": ""}}
    )
    
    log_audit_event(
        action="ROUTE_CANCELLED",
        user_id=str(current_user.id),
        entity_type="route",
        entity_id=route_id
    )
    
    return {"message": "Route cancelled successfully"}

@app.post("/api/routes/{route_id}/start")
async def start_route(
    route_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Driver starts route"""
    if current_user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can start routes")
    
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    if route.get("assigned_driver_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Route not assigned to you")
    
    if route.get("status") != "Planned":
        raise HTTPException(status_code=400, detail="Route is not in Planned status")
    
    routes_collection.update_one(
        {"_id": ObjectId(route_id)},
        {"$set": {
            "status": "InProgress",
            "actual_start_time": datetime.utcnow()
        }}
    )
    
    log_audit_event(
        action="ROUTE_STARTED",
        user_id=str(current_user.id),
        entity_type="route",
        entity_id=route_id
    )
    
    return {"message": "Route started successfully"}

@app.post("/api/routes/{route_id}/complete-stop")
async def complete_stop(
    route_id: str,
    stop_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Driver completes a route stop"""
    if current_user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can complete stops")
    
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    if route.get("assigned_driver_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Route not assigned to you")
    
    stop_sequence = stop_data.get("stop_sequence")
    if stop_sequence is None:
        raise HTTPException(status_code=400, detail="stop_sequence is required")
    
    stop = route_stops_collection.find_one({
        "route_id": route_id,
        "stop_sequence": stop_sequence
    })
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    
    route_stops_collection.update_one(
        {"_id": stop["_id"]},
        {"$set": {
            "stop_status": "Completed",
            "actual_arrival": datetime.utcnow()
        }}
    )
    
    log_audit_event(
        action="ROUTE_STOP_COMPLETED",
        user_id=str(current_user.id),
        entity_type="route_stop",
        entity_id=str(stop["_id"])
    )
    
    return {"message": "Stop completed successfully"}

@app.post("/api/routes/{route_id}/complete")
async def complete_route(
    route_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Driver completes entire route"""
    if current_user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can complete routes")
    
    route = routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    if route.get("assigned_driver_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Route not assigned to you")
    
    routes_collection.update_one(
        {"_id": ObjectId(route_id)},
        {"$set": {
            "status": "Completed",
            "actual_end_time": datetime.utcnow()
        }}
    )
    
    log_audit_event(
        action="ROUTE_COMPLETED",
        user_id=str(current_user.id),
        entity_type="route",
        entity_id=route_id
    )
    
    return {"message": "Route completed successfully"}

@app.post("/api/routes/optimize")
async def optimize_route_endpoint(
    optimization_request: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Optimize route from shipments (Supervisor/Admin only)"""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(status_code=403, detail="Admin or Supervisor access required")
    
    tracking_numbers = optimization_request.get("shipment_tracking_numbers", [])
    if not tracking_numbers:
        raise HTTPException(status_code=400, detail="No shipments provided")
    
    # Get shipments
    shipments = list(shipments_collection.find({
        "tracking_number": {"$in": tracking_numbers}
    }))
    
    # Group by office
    office_ids = set()
    for shipment in shipments:
        office_ids.add(shipment.get("destination_office_id"))
    
    # Get offices with coordinates
    offices_list = []
    for office_id in office_ids:
        office = offices_collection.find_one({"_id": ObjectId(office_id)})
        if office:
            offices_list.append({
                "id": office_id,
                "name": office.get("name"),
                "coordinates": office.get("coordinates") or {}
            })
    
    # Optimize
    result = optimize_route(offices_list, shipments)
    
    return result

