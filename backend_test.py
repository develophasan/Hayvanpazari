#!/usr/bin/env python3
"""
HayvanPazarı Backend API Test Suite
Tests all backend endpoints as requested in the review.
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Backend URL from frontend .env
BACKEND_URL = "https://hayvanpazari.preview.emergentagent.com/api"

class HayvanPazariTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.user_id = None
        self.test_user_data = {
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"+90555{uuid.uuid4().hex[:7]}",
            "password": "TestPassword123!",
            "first_name": "Ahmet",
            "last_name": "Yılmaz"
        }
        self.created_listing_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        
        self.test_results.append(result)
        
    def make_request(self, method, endpoint, data=None, headers=None, files=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if self.access_token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method.upper() == "POST":
                if files:
                    response = requests.post(url, data=data, files=files, headers={k:v for k,v in headers.items() if k != "Content-Type"}, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                if files:
                    response = requests.put(url, data=data, files=files, headers={k:v for k,v in headers.items() if k != "Content-Type"}, timeout=30)
                else:
                    response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = self.make_request("GET", "/")
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data and "status" in data:
                self.log_result("Root Endpoint", True, "API is running", data)
                return True
            else:
                self.log_result("Root Endpoint", False, "Invalid response format", data)
                return False
        else:
            status_code = response.status_code if response else "No response"
            self.log_result("Root Endpoint", False, f"Failed with status: {status_code}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        response = self.make_request("POST", "/auth/register", self.test_user_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.log_result("User Registration", True, "User registered successfully", {
                    "user_id": self.user_id,
                    "email": data["user"]["email"]
                })
                return True
            else:
                self.log_result("User Registration", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("User Registration", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                # Update token (should be same as registration)
                self.access_token = data["access_token"]
                self.log_result("User Login", True, "Login successful", {
                    "user_id": data["user"]["id"],
                    "email": data["user"]["email"]
                })
                return True
            else:
                self.log_result("User Login", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("User Login", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_sms_verification(self):
        """Test SMS verification endpoint"""
        verification_data = {
            "phone": self.test_user_data["phone"],
            "code": "1234"  # Mock code as per backend implementation
        }
        
        response = self.make_request("POST", "/auth/verify-sms", verification_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                self.log_result("SMS Verification", True, "SMS verified successfully", data)
                return True
            else:
                self.log_result("SMS Verification", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("SMS Verification", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "email" in data:
                self.log_result("Get Current User", True, "User data retrieved successfully", {
                    "user_id": data["id"],
                    "email": data["email"],
                    "is_phone_verified": data.get("is_phone_verified", False)
                })
                return True
            else:
                self.log_result("Get Current User", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Get Current User", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_get_categories(self):
        """Test get categories endpoint"""
        response = self.make_request("GET", "/categories")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if categories have required fields
                first_category = data[0]
                required_fields = ["id", "name", "name_en", "icon", "breeds"]
                if all(field in first_category for field in required_fields):
                    self.log_result("Get Categories", True, f"Retrieved {len(data)} categories", {
                        "categories_count": len(data),
                        "sample_category": first_category["name"]
                    })
                    return True
                else:
                    self.log_result("Get Categories", False, "Categories missing required fields", data[0])
                    return False
            else:
                self.log_result("Get Categories", False, "No categories returned or invalid format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Get Categories", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_create_listing(self):
        """Test create listing endpoint"""
        listing_data = {
            "title": "Sağlıklı Holstein İnek",
            "description": "2 yaşında, sağlıklı Holstein inek. Günlük 25 litre süt veriyor.",
            "category": "cattle",
            "animal_details": {
                "breed": "Holstein",
                "age_months": 24,
                "weight_kg": 450.0,
                "gender": "female",
                "purpose": "dairy",
                "pregnancy_status": "not_pregnant",
                "milk_yield": 25.0,
                "health_status": "healthy",
                "vaccinations": ["Şap", "Bruseloz"],
                "certificates": ["Sağlık Sertifikası"],
                "ear_tag": "TR001234567"
            },
            "price": 15000.0,
            "price_type": "negotiable",
            "images": [],
            "videos": [],
            "location": {
                "city": "İstanbul",
                "district": "Çatalca",
                "latitude": 41.1413,
                "longitude": 28.4622
            }
        }
        
        response = self.make_request("POST", "/listings", listing_data)
        
        if response and response.status_code == 200:
            data = response.json()
            # Check for either "id" or "_id" field
            listing_id = data.get("id") or data.get("_id")
            if listing_id and "title" in data:
                self.created_listing_id = listing_id
                self.log_result("Create Listing", True, "Listing created successfully", {
                    "listing_id": listing_id,
                    "title": data["title"],
                    "price": data["price"]
                })
                return True
            else:
                self.log_result("Create Listing", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Create Listing", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_get_listings(self):
        """Test get listings endpoint with filters"""
        # Test without filters
        response = self.make_request("GET", "/listings")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Get Listings (No Filter)", True, f"Retrieved {len(data)} listings", {
                    "listings_count": len(data)
                })
                
                # Test with category filter
                response_filtered = self.make_request("GET", "/listings", {"category": "cattle"})
                if response_filtered and response_filtered.status_code == 200:
                    filtered_data = response_filtered.json()
                    self.log_result("Get Listings (Category Filter)", True, f"Retrieved {len(filtered_data)} cattle listings", {
                        "filtered_count": len(filtered_data)
                    })
                    return True
                else:
                    self.log_result("Get Listings (Category Filter)", False, "Failed to filter by category")
                    return False
            else:
                self.log_result("Get Listings (No Filter)", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Get Listings (No Filter)", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_get_listing_detail(self):
        """Test get listing detail endpoint"""
        if not self.created_listing_id:
            self.log_result("Get Listing Detail", False, "No listing ID available for testing")
            return False
            
        response = self.make_request("GET", f"/listings/{self.created_listing_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "title" in data and "views" in data:
                self.log_result("Get Listing Detail", True, "Listing detail retrieved successfully", {
                    "listing_id": data["id"],
                    "title": data["title"],
                    "views": data["views"]
                })
                return True
            else:
                self.log_result("Get Listing Detail", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Get Listing Detail", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_update_listing(self):
        """Test update listing endpoint"""
        if not self.created_listing_id:
            self.log_result("Update Listing", False, "No listing ID available for testing")
            return False
            
        update_data = {
            "title": "Güncellenmiş Holstein İnek",
            "price": 16000.0,
            "description": "Güncellenmiş açıklama - Çok sağlıklı ve verimli inek."
        }
        
        response = self.make_request("PUT", f"/listings/{self.created_listing_id}", update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                self.log_result("Update Listing", True, "Listing updated successfully", data)
                return True
            else:
                self.log_result("Update Listing", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Update Listing", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_send_message(self):
        """Test send message endpoint"""
        if not self.created_listing_id:
            self.log_result("Send Message", False, "No listing ID available for testing")
            return False
            
        # Create a second user to send message to
        second_user_data = {
            "email": f"buyer_{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"+90555{uuid.uuid4().hex[:7]}",
            "password": "BuyerPassword123!",
            "first_name": "Mehmet",
            "last_name": "Demir"
        }
        
        # Register second user
        response = self.make_request("POST", "/auth/register", second_user_data)
        if not response or response.status_code != 200:
            self.log_result("Send Message", False, "Failed to create second user for messaging test")
            return False
            
        second_user_token = response.json()["access_token"]
        second_user_id = response.json()["user"]["id"]
        
        # Send message as second user to listing owner
        message_data = {
            "listing_id": self.created_listing_id,
            "receiver_id": self.user_id,
            "message": "Merhaba, bu inek hala satılık mı?",
            "message_type": "text"
        }
        
        # Temporarily switch to second user's token
        original_token = self.access_token
        self.access_token = second_user_token
        
        response = self.make_request("POST", "/messages", message_data)
        
        # Switch back to original token
        self.access_token = original_token
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "message" in data:
                self.log_result("Send Message", True, "Message sent successfully", {
                    "message_id": data["id"],
                    "message": data["message"],
                    "sender_id": data["sender_id"]
                })
                return True
            else:
                self.log_result("Send Message", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Send Message", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_get_conversations(self):
        """Test get conversations endpoint"""
        response = self.make_request("GET", "/messages/conversations")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Get Conversations", True, f"Retrieved {len(data)} conversations", {
                    "conversations_count": len(data)
                })
                return True
            else:
                self.log_result("Get Conversations", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Get Conversations", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_update_profile(self):
        """Test update profile endpoint"""
        # Use form data as per the backend implementation
        profile_data = {
            "first_name": "Ahmet Güncellenmiş",
            "last_name": "Yılmaz Güncellenmiş",
            "user_type": "seller",
            "city": "Ankara",
            "district": "Çankaya"
        }
        
        # Send as form data
        headers = {}  # Remove Content-Type to let requests handle form data
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        response = self.make_request("PUT", "/users/profile", profile_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                self.log_result("Update Profile", True, "Profile updated successfully", data)
                return True
            else:
                self.log_result("Update Profile", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Update Profile", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def test_delete_listing(self):
        """Test delete listing endpoint"""
        if not self.created_listing_id:
            self.log_result("Delete Listing", False, "No listing ID available for testing")
            return False
            
        response = self.make_request("DELETE", f"/listings/{self.created_listing_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                self.log_result("Delete Listing", True, "Listing deleted successfully", data)
                return True
            else:
                self.log_result("Delete Listing", False, "Invalid response format", data)
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_result("Delete Listing", False, f"Failed with status {status_code}: {error_msg}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting HayvanPazarı Backend API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 60)
        
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("SMS Verification", self.test_sms_verification),
            ("Get Current User", self.test_get_current_user),
            ("Get Categories", self.test_get_categories),
            ("Create Listing", self.test_create_listing),
            ("Get Listings", self.test_get_listings),
            ("Get Listing Detail", self.test_get_listing_detail),
            ("Update Listing", self.test_update_listing),
            ("Send Message", self.test_send_message),
            ("Get Conversations", self.test_get_conversations),
            ("Update Profile", self.test_update_profile),
            ("Delete Listing", self.test_delete_listing),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Exception occurred - {str(e)}")
                self.log_result(test_name, False, f"Exception: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed, self.test_results

def main():
    """Main function to run tests"""
    tester = HayvanPazariTester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w', encoding='utf-8') as f:
        json.dump({
            "summary": {
                "passed": passed,
                "failed": failed,
                "total": passed + failed,
                "success_rate": (passed/(passed+failed)*100) if (passed+failed) > 0 else 0
            },
            "results": results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Detailed results saved to: /app/backend_test_results.json")
    
    # Return exit code based on results
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())