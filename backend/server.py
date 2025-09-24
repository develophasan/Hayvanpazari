from animal_breeds_data import ANIMAL_BREEDS
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import base64
from bson import ObjectId
import pymongo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create indexes
async def create_indexes():
    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)
    
    # Listings indexes
    await db.listings.create_index([("title", pymongo.TEXT), ("description", pymongo.TEXT)])
    await db.listings.create_index("category")
    await db.listings.create_index("location.city")
    await db.listings.create_index("price")
    await db.listings.create_index("created_at")
    await db.listings.create_index("is_active")
    
    # Messages indexes
    await db.messages.create_index([("sender_id", 1), ("receiver_id", 1)])
    await db.messages.create_index("created_at")

app = FastAPI(title="HayvanPazarı API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = "hayvan-pazari-secret-key-2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME = timedelta(days=7)

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + JWT_EXPIRATION_TIME
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Models
class UserType(str):
    BUYER = "buyer"
    SELLER = "seller"
    BOTH = "both"

class ListingStatus(str):
    ACTIVE = "active"
    SOLD = "sold"
    INACTIVE = "inactive"
    PENDING = "pending"

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    phone: str
    password: str
    first_name: str
    last_name: str
    user_type: str = UserType.BUYER
    profile_image: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    is_verified: bool = False
    is_phone_verified: bool = False
    kyc_status: str = "not_verified"  # not_verified, pending, verified
    kyc_documents: Optional[Dict[str, Any]] = None
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    email: EmailStr
    phone: str
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SMSVerification(BaseModel):
    phone: str
    code: str

class AnimalCategory(BaseModel):
    id: str
    name: str
    name_en: str
    icon: str
    breeds: List[str]

class Location(BaseModel):
    city: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AnimalDetails(BaseModel):
    breed: Optional[str] = None
    age_months: Optional[int] = None
    weight_kg: Optional[float] = None
    gender: Optional[str] = None  # male, female
    purpose: Optional[str] = None  # meat, dairy, breeding
    pregnancy_status: Optional[str] = None  # pregnant, not_pregnant, unknown
    milk_yield: Optional[float] = None
    health_status: str = "healthy"
    vaccinations: List[str] = []
    certificates: List[str] = []
    ear_tag: Optional[str] = None

class Listing(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    category: str
    animal_details: AnimalDetails
    price: float
    price_type: str = "fixed"  # fixed, negotiable, auction
    images: List[str] = []  # base64 encoded images
    videos: List[str] = []  # base64 encoded videos
    location: Location
    seller_id: str
    status: str = ListingStatus.ACTIVE
    views: int = 0
    favorites: int = 0
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    animal_details: AnimalDetails
    price: float
    price_type: str = "fixed"
    images: List[str] = []
    videos: List[str] = []
    location: Location

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[str] = None
    animal_details: Optional[AnimalDetails] = None
    location: Optional[Location] = None
    status: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    listing_id: str
    sender_id: str
    receiver_id: str
    message: str
    message_type: str = "text"  # text, offer, image
    offer_amount: Optional[float] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class MessageCreate(BaseModel):
    listing_id: str
    receiver_id: str
    message: str
    message_type: str = "text"
    offer_amount: Optional[float] = None

class SearchFilters(BaseModel):
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    city: Optional[str] = None
    district: Optional[str] = None
    breed: Optional[str] = None
    min_age_months: Optional[int] = None
    max_age_months: Optional[int] = None
    gender: Optional[str] = None
    purpose: Optional[str] = None

# Categories Data
ANIMAL_CATEGORIES = [
    {
        "id": "cattle",
        "name": "Sığır",
        "name_en": "Cattle",
        "icon": "🐄",
        "breeds": ["Holstein", "Simmental", "Angus", "Yerli Kara", "Montofon", "Jersey"]
    },
    {
        "id": "sheep",
        "name": "Koyun",
        "name_en": "Sheep",
        "icon": "🐑",
        "breeds": ["Akkaraman", "Morkaraman", "İvesi", "Kıvırcık", "Sakız", "Karacabey Merinosu"]
    },
    {
        "id": "goat",
        "name": "Keçi",
        "name_en": "Goat",
        "icon": "🐐",
        "breeds": ["Saanen", "Kıl Keçisi", "Angora", "Malta", "Damascus", "Honamlı"]
    },
    {
        "id": "poultry",
        "name": "Kümes Hayvanları",
        "name_en": "Poultry",
        "icon": "🐔",
        "breeds": ["Tavuk", "Horoz", "Ördek", "Kaz", "Hindi", "Güvercin"]
    },
    {
        "id": "horse",
        "name": "At",
        "name_en": "Horse",
        "icon": "🐴",
        "breeds": ["Arap Atı", "Rahvan", "Karacabey", "Malakan", "Türkmen Atı"]
    }
]

# API Routes

@api_router.get("/")
async def root():
    return {"message": "HayvanPazarı API v1.0.0", "status": "running"}

# Categories
@api_router.get("/categories", response_model=List[AnimalCategory])
async def get_categories():
    """Güncellenmiş hayvan kategorileri ve ırkları döndür"""
    categories = []
    for category_id, category_data in ANIMAL_BREEDS.items():
        categories.append({
            "id": category_id,
            "name": category_data["name"], 
            "name_en": category_data["name_en"],
            "icon": category_data["icon"],
            "breeds": category_data["breeds"]
        })
    
    print(f"📂 Categories loaded: {len(categories)} categories, total breeds: {sum(len(cat['breeds']) for cat in categories)}")
    return categories

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"phone": user_data.phone}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password
    user_dict["id"] = str(uuid.uuid4())
    user_dict["user_type"] = UserType.BUYER  # Set default user type
    user_dict["is_verified"] = False
    user_dict["is_phone_verified"] = False
    user_dict["kyc_status"] = "not_verified"
    user_dict["rating"] = 0.0
    user_dict["total_reviews"] = 0
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token({"user_id": user_dict["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["id"],
            "email": user_dict["email"],
            "first_name": user_dict["first_name"],
            "last_name": user_dict["last_name"],
            "phone": user_dict["phone"],
            "user_type": user_dict["user_type"]
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"user_id": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "phone": user["phone"],
            "user_type": user["user_type"],
            "is_verified": user.get("is_verified", False),
            "is_phone_verified": user.get("is_phone_verified", False)
        }
    }

@api_router.post("/auth/verify-sms")
async def verify_sms(verification: SMSVerification, user_id: str = Depends(verify_token)):
    # Mock SMS verification - always accept 1234
    if verification.code != "1234":
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_phone_verified": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Phone verified successfully"}

@api_router.get("/auth/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove password and MongoDB _id from response
    user.pop("password", None)
    user.pop("_id", None)
    return user

# User Profile Routes
@api_router.put("/users/profile")
async def update_profile(
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    user_type: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    profile_image: Optional[str] = Form(None),
    user_id: str = Depends(verify_token)
):
    update_data = {"updated_at": datetime.utcnow()}
    
    if first_name:
        update_data["first_name"] = first_name
    if last_name:
        update_data["last_name"] = last_name
    if user_type:
        update_data["user_type"] = user_type
    if city or district:
        # Get current user to preserve existing location data
        current_user = await db.users.find_one({"id": user_id})
        current_location = current_user.get("location", {}) if current_user else {}
        
        location = {
            "city": city if city else current_location.get("city", ""),
            "district": district if district else current_location.get("district", "")
        }
        update_data["location"] = location
    if profile_image:
        update_data["profile_image"] = profile_image
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "Profile updated successfully"}

# Listing Routes
@api_router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, user_id: str = Depends(verify_token)):
    listing_dict = listing_data.dict()
    listing_dict["id"] = str(uuid.uuid4())
    listing_dict["seller_id"] = user_id
    listing_dict["created_at"] = datetime.utcnow()
    listing_dict["updated_at"] = datetime.utcnow()
    
    result = await db.listings.insert_one(listing_dict)
    # Remove MongoDB's _id field to avoid conflicts
    listing_dict.pop("_id", None)
    return Listing(**listing_dict)

@api_router.get("/listings", response_model=List[Listing])
async def get_listings(
    category: Optional[str] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    # TEMPORARY: Get ALL listings without status filter for debugging
    query = {}  # Remove status filter temporarily
    
    if category:
        query["category"] = category
    if city:
        query["location.city"] = city
    if district:
        query["location.district"] = district
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    if search:
        query["$text"] = {"$search": search}
    
    print(f"📋 Listings query: {query}")  # Debug log
    listings = await db.listings.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    print(f"📋 Found {len(listings)} listings")  # Debug log
    
    if listings:
        print(f"📋 First listing status: {listings[0].get('status')}")  # Debug status field
    
    # Set id field from _id for frontend compatibility
    for listing in listings:
        listing["id"] = str(listing["_id"])  # Copy _id to id as string
        listing.pop("_id", None)  # Remove _id
    return [Listing(**listing) for listing in listings]

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    print(f"🔍 Looking for listing with ID: {listing_id}")
    
    # Try to find by multiple ID formats
    listing = None
    
    # Try 1: Direct _id match (UUID format)
    listing = await db.listings.find_one({"_id": listing_id})
    if listing:
        print(f"✅ Found by _id (UUID): {listing_id}")
    
    # Try 2: Search by id field (may be hex)
    if not listing:
        listing = await db.listings.find_one({"id": listing_id})
        if listing:
            print(f"✅ Found by id field: {listing_id}")
    
    # Try 3: Search all listings where str(_id) matches (hex conversion)
    if not listing:
        all_listings = await db.listings.find({}).to_list(None)
        for l in all_listings:
            if str(l["_id"]) == listing_id:
                listing = l
                print(f"✅ Found by hex conversion: {listing_id} -> {l['_id']}")
                break
    
    if not listing:
        print(f"❌ Listing not found with any ID format: {listing_id}")
        raise HTTPException(status_code=404, detail="Listing not found")
    
    print(f"✅ Listing found: {listing.get('title', 'No title')}")
    
    # Increment view count using original _id
    original_id = listing["_id"]
    await db.listings.update_one({"_id": original_id}, {"$inc": {"views": 1}})
    listing["views"] = listing.get("views", 0) + 1
    
    # Set id field from _id for frontend compatibility
    listing["id"] = str(listing["_id"])
    listing.pop("_id", None)  # Remove _id
    
    # Ensure all required fields exist
    if "animal_details" not in listing:
        listing["animal_details"] = {}
    if "images" not in listing:
        listing["images"] = []
    if "videos" not in listing:
        listing["videos"] = []
        
    return Listing(**listing)

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, listing_data: ListingUpdate, user_id: str = Depends(verify_token)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = listing_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    return {"message": "Listing updated successfully"}

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user_id: str = Depends(verify_token)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": ListingStatus.INACTIVE}})
    return {"message": "Listing deleted successfully"}

@api_router.get("/users/{user_id}/listings", response_model=List[Listing])
async def get_user_listings(user_id: str, current_user_id: str = Depends(verify_token)):
    if user_id != current_user_id:
        # Only show active listings for other users
        query = {"seller_id": user_id, "status": ListingStatus.ACTIVE}
    else:
        # Show all listings for current user
        query = {"seller_id": user_id}
    
    listings = await db.listings.find(query).sort("created_at", -1).to_list(100)
    # Set id field from _id for frontend compatibility
    for listing in listings:
        listing["id"] = str(listing["_id"])  # Copy _id to id as string
        listing.pop("_id", None)  # Remove _id
    return [Listing(**listing) for listing in listings]

# Messages Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, user_id: str = Depends(verify_token)):
    message_dict = message_data.dict()
    message_dict["id"] = str(uuid.uuid4())
    message_dict["sender_id"] = user_id
    message_dict["created_at"] = datetime.utcnow()
    
    result = await db.messages.insert_one(message_dict)
    # Remove MongoDB _id field to avoid conflicts  
    message_dict.pop("_id", None)
    
    # Ensure the response follows the expected Message model
    return Message(**message_dict)

@api_router.get("/messages/conversations")
async def get_conversations(user_id: str = Depends(verify_token)):
    # Get all conversations for the user
    pipeline = [
        {"$match": {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user_id]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$$ROOT"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$receiver_id", user_id]}, {"$eq": ["$is_read", False]}]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    # Get user details for each conversation and clean up ObjectIds
    for conv in conversations:
        # Clean up ObjectIds from the conversation data
        if "last_message" in conv and "_id" in conv["last_message"]:
            conv["last_message"].pop("_id", None)
        
        other_user = await db.users.find_one({"id": conv["_id"]})
        if other_user:
            conv["other_user"] = {
                "id": other_user["id"],
                "first_name": other_user["first_name"],
                "last_name": other_user["last_name"],
                "profile_image": other_user.get("profile_image")
            }
        
        # Get listing details
        listing = await db.listings.find_one({"id": conv["last_message"]["listing_id"]})
        if listing:
            conv["listing"] = {
                "id": listing["id"],
                "title": listing["title"],
                "price": listing["price"],
                "images": listing["images"][:1] if listing["images"] else []
            }
    
    return conversations

@api_router.get("/messages/{other_user_id}/{listing_id}")
async def get_messages(other_user_id: str, listing_id: str, user_id: str = Depends(verify_token)):
    messages = await db.messages.find({
        "$and": [
            {"listing_id": listing_id},
            {
                "$or": [
                    {"$and": [{"sender_id": user_id}, {"receiver_id": other_user_id}]},
                    {"$and": [{"sender_id": other_user_id}, {"receiver_id": user_id}]}
                ]
            }
        ]
    }).sort("created_at", 1).to_list(1000)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "listing_id": listing_id},
        {"$set": {"is_read": True}}
    )
    
    # Remove MongoDB _id field from each message
    for message in messages:
        message.pop("_id", None)
    return [Message(**message) for message in messages]

# Initialize database on startup
@app.on_event("startup")
async def startup_db():
    await create_indexes()

app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()