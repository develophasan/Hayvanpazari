#!/usr/bin/env python3
"""
Test with the specific user mentioned in the review request
"""

import requests
import json

BACKEND_URL = "https://livestock-app-2.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "123456"

def test_specific_user_login():
    """Test login with the specific test user"""
    print("🔐 Testing login with specific user: test@test.com")
    
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful with test@test.com")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Name: {data['user']['first_name']} {data['user']['last_name']}")
            print(f"   User Type: {data['user']['user_type']}")
            
            # Test creating a listing with this user
            auth_token = data["access_token"]
            headers = {"Authorization": f"Bearer {auth_token}"}
            
            listing_data = {
                "title": "Test İlan - Holstein İnek",
                "description": "Test kullanıcısı tarafından oluşturulan ilan",
                "category": "cattle",
                "animal_details": {
                    "breed": "Holstein",
                    "age_months": 30,
                    "weight_kg": 500.0,
                    "gender": "female",
                    "purpose": "dairy",
                    "health_status": "healthy",
                    "ear_tag": "TEST001"
                },
                "price": 18000.0,
                "price_type": "negotiable",
                "images": [],
                "location": {
                    "city": "İstanbul",
                    "district": "Kadıköy"
                }
            }
            
            listing_response = requests.post(f"{BACKEND_URL}/listings", json=listing_data, headers=headers, timeout=30)
            
            if listing_response.status_code == 200:
                listing = listing_response.json()
                print("✅ Listing creation successful with test user")
                print(f"   Listing ID: {listing.get('id', listing.get('_id'))}")
                print(f"   Title: {listing['title']}")
                return True
            else:
                print(f"❌ Listing creation failed: {listing_response.status_code}")
                print(f"   Error: {listing_response.text}")
                return False
                
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_specific_user_login()
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Specific user test completed")