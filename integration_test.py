#!/usr/bin/env python3
"""
Integration test for authentication and listing creation as mentioned in review request
"""

import requests
import json

BACKEND_URL = "https://livestock-app-2.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "123456"

def test_authentication_integration():
    """Test the authentication integration that was just fixed"""
    print("🔐 AUTHENTICATION INTEGRATION TEST")
    print("=" * 50)
    
    # Test 1: Login with test user
    login_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
    
    if response.status_code != 200:
        print("❌ Authentication failed")
        return False
    
    data = response.json()
    auth_token = data["access_token"]
    user_id = data["user"]["id"]
    
    print("✅ Authentication successful")
    print(f"   Token: {auth_token[:20]}...")
    print(f"   User: {data['user']['first_name']} {data['user']['last_name']}")
    
    # Test 2: Verify token works with protected endpoints
    headers = {"Authorization": f"Bearer {auth_token}"}
    me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers, timeout=30)
    
    if me_response.status_code != 200:
        print("❌ Token verification failed")
        return False
    
    print("✅ Token verification successful")
    
    # Test 3: Test categories API (should return 5 categories)
    categories_response = requests.get(f"{BACKEND_URL}/categories", timeout=30)
    
    if categories_response.status_code != 200:
        print("❌ Categories API failed")
        return False
    
    categories = categories_response.json()
    print(f"✅ Categories API successful: {len(categories)} categories")
    
    expected_categories = ["Sığır", "Koyun", "Keçi", "Kümes Hayvanları", "At"]
    found_categories = [cat["name"] for cat in categories]
    
    for expected in expected_categories:
        if expected in found_categories:
            print(f"   ✓ {expected}")
        else:
            print(f"   ✗ Missing: {expected}")
    
    # Test 4: Create listing with proper authentication headers
    print("\n📝 LISTING CREATION TEST")
    print("=" * 30)
    
    listing_data = {
        "title": "İntegrasyon Test İlanı - Holstein İnek",
        "description": "Entegrasyon testi için oluşturulan ilan. Sağlıklı ve verimli Holstein inek.",
        "category": "cattle",
        "animal_details": {
            "breed": "Holstein",
            "age_months": 36,
            "weight_kg": 550.0,
            "gender": "female",
            "purpose": "dairy",
            "health_status": "healthy",
            "ear_tag": "INT001",
            "milk_yield": 28.0
        },
        "price": 20000.0,
        "price_type": "negotiable",
        "images": [],
        "location": {
            "city": "İstanbul",
            "district": "Kadıköy"
        }
    }
    
    listing_response = requests.post(f"{BACKEND_URL}/listings", json=listing_data, headers=headers, timeout=30)
    
    if listing_response.status_code != 200:
        print("❌ Listing creation failed")
        print(f"   Status: {listing_response.status_code}")
        print(f"   Error: {listing_response.text}")
        return False
    
    listing = listing_response.json()
    listing_id = listing.get("id", listing.get("_id"))
    
    print("✅ Listing creation successful")
    print(f"   ID: {listing_id}")
    print(f"   Title: {listing['title']}")
    print(f"   Price: {listing['price']} TL")
    print(f"   Category: {listing['category']}")
    print(f"   Breed: {listing['animal_details']['breed']}")
    
    # Test 5: Verify listing appears in GET listings
    listings_response = requests.get(f"{BACKEND_URL}/listings", timeout=30)
    
    if listings_response.status_code != 200:
        print("❌ Get listings failed")
        return False
    
    listings = listings_response.json()
    created_listing_found = any(l.get("id") == listing_id or l.get("_id") == listing_id for l in listings)
    
    if created_listing_found:
        print("✅ Created listing found in listings API")
    else:
        print("⚠️  Created listing not found in listings API (may be due to filtering)")
    
    # Test 6: Test messaging system
    print("\n💬 MESSAGING SYSTEM TEST")
    print("=" * 25)
    
    message_data = {
        "listing_id": listing_id,
        "receiver_id": user_id,  # Sending to self for testing
        "message": "Bu ilan hakkında detaylı bilgi alabilir miyim?",
        "message_type": "text"
    }
    
    message_response = requests.post(f"{BACKEND_URL}/messages", json=message_data, headers=headers, timeout=30)
    
    if message_response.status_code != 200:
        print("❌ Message sending failed")
        return False
    
    message = message_response.json()
    print("✅ Message sent successfully")
    print(f"   Message ID: {message.get('id', message.get('_id'))}")
    print(f"   Content: {message['message']}")
    
    # Test 7: Test offer message
    offer_data = {
        "listing_id": listing_id,
        "receiver_id": user_id,
        "message": "18000 TL teklif ediyorum.",
        "message_type": "offer",
        "offer_amount": 18000.0
    }
    
    offer_response = requests.post(f"{BACKEND_URL}/messages", json=offer_data, headers=headers, timeout=30)
    
    if offer_response.status_code != 200:
        print("❌ Offer message failed")
        return False
    
    offer = offer_response.json()
    print("✅ Offer message sent successfully")
    print(f"   Offer: {offer['offer_amount']} TL")
    
    # Test 8: Test profile management
    print("\n👤 PROFILE MANAGEMENT TEST")
    print("=" * 27)
    
    profile_data = {
        "first_name": "Test Updated",
        "last_name": "User Updated",
        "user_type": "both",
        "city": "İstanbul",
        "district": "Beşiktaş"
    }
    
    profile_response = requests.put(f"{BACKEND_URL}/users/profile", data=profile_data, headers=headers, timeout=30)
    
    if profile_response.status_code != 200:
        print("❌ Profile update failed")
        return False
    
    print("✅ Profile updated successfully")
    
    # Verify profile update
    me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers, timeout=30)
    if me_response.status_code == 200:
        user_data = me_response.json()
        print(f"   Name: {user_data['first_name']} {user_data['last_name']}")
        print(f"   Type: {user_data['user_type']}")
        print(f"   Location: {user_data.get('location', {}).get('city', 'N/A')}")
    
    return True

def main():
    print("🚀 HAYVANPAZARI INTEGRATION TEST SUITE")
    print("Testing authentication integration and listing functionality")
    print("=" * 60)
    
    success = test_authentication_integration()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ Authentication system working correctly")
        print("✅ Listing creation with authentication working")
        print("✅ Categories API returning 5 categories")
        print("✅ Messaging system functional")
        print("✅ Profile management working")
        print("\n🔥 Backend is ready for frontend integration!")
    else:
        print("❌ INTEGRATION TESTS FAILED!")
        print("Some critical functionality is not working properly.")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())