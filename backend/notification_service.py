# Notification Service for HayvanPazarı
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import uuid


class NotificationType(str, Enum):
    MESSAGE = "message"
    OFFER = "offer"
    LISTING = "listing"
    SECURITY = "security"
    PAYMENT = "payment"
    PROFILE = "profile"

class NotificationPriority(str, Enum):
    CRITICAL = "critical"  # Security, payment - Email + Push + Sound
    HIGH = "high"         # Messages, offers - Push + Sound  
    MEDIUM = "medium"     # Listing updates - Push only
    LOW = "low"           # General info - In-app only

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


async def create_notification(
    db,
    user_id: str, 
    notification_type: NotificationType, 
    priority: NotificationPriority,
    title: str, 
    message: str, 
    data: Optional[Dict[str, Any]] = None
) -> str:
    """Create a new notification"""
    notification_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "priority": priority,
        "title": title,
        "message": message,
        "data": data or {},
        "status": NotificationStatus.UNREAD,
        "is_email_sent": False,
        "is_push_sent": False,
        "created_at": datetime.utcnow(),
        "read_at": None
    }
    
    result = await db.notifications.insert_one(notification_doc)
    print(f"🔔 Created notification: {title} for user {user_id}")
    
    # Send notification based on priority
    await send_notification(db, notification_doc)
    
    return str(result.inserted_id)

async def send_notification(db, notification_doc: Dict[str, Any]):
    """Send notification via appropriate channels based on priority"""
    user_id = notification_doc["user_id"]
    priority = notification_doc["priority"]
    
    # Get user notification settings
    settings = await get_user_notification_settings(db, user_id)
    
    # Check quiet hours
    if is_quiet_hours(settings):
        if priority != NotificationPriority.CRITICAL:
            print(f"⏰ Notification delayed due to quiet hours: {notification_doc['title']}")
            return
    
    # Send push notification
    if settings.get("push_notifications", True) and not notification_doc["is_push_sent"]:
        await send_push_notification(db, notification_doc, settings)
    
    # Send email for critical and high priority
    if priority in [NotificationPriority.CRITICAL, NotificationPriority.HIGH]:
        if settings.get("email_notifications", True) and not notification_doc["is_email_sent"]:
            await send_email_notification(db, notification_doc)

async def get_user_notification_settings(db, user_id: str) -> Dict[str, Any]:
    """Get user notification settings or defaults"""
    settings = await db.notification_settings.find_one({"user_id": user_id})
    if not settings:
        # Create default settings
        default_settings = {
            "user_id": user_id,
            "email_notifications": True,
            "push_notifications": True,
            "sound_enabled": True,
            "vibration_enabled": True,
            "quiet_hours_enabled": False,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "notification_types": {
                "messages": True,
                "offers": True,
                "listings": True,
                "security": True,
                "payments": True,
                "profile": True
            }
        }
        await db.notification_settings.insert_one(default_settings)
        return default_settings
    return settings

def is_quiet_hours(settings: Dict[str, Any]) -> bool:
    """Check if current time is within quiet hours"""
    if not settings.get("quiet_hours_enabled", False):
        return False
    
    now = datetime.now().time()
    start_time = datetime.strptime(settings.get("quiet_hours_start", "22:00"), "%H:%M").time()
    end_time = datetime.strptime(settings.get("quiet_hours_end", "08:00"), "%H:%M").time()
    
    if start_time <= end_time:
        return start_time <= now <= end_time
    else:  # Crosses midnight
        return now >= start_time or now <= end_time

async def send_push_notification(db, notification_doc: Dict[str, Any], settings: Dict[str, Any]):
    """Send push notification (mock implementation for now)"""
    # This would integrate with Expo Push Notifications in production
    print(f"📱 PUSH: {notification_doc['title']} - {notification_doc['message']}")
    
    # Update notification as sent
    await db.notifications.update_one(
        {"_id": notification_doc["_id"]},
        {"$set": {"is_push_sent": True}}
    )

async def send_email_notification(db, notification_doc: Dict[str, Any]):
    """Send email notification (mock implementation for now)"""
    # This would integrate with email service in production
    user = await db.users.find_one({"_id": notification_doc["user_id"]})
    if user:
        print(f"📧 EMAIL to {user['email']}: {notification_doc['title']} - {notification_doc['message']}")
    
    # Update notification as sent
    await db.notifications.update_one(
        {"_id": notification_doc["_id"]},
        {"$set": {"is_email_sent": True}}
    )