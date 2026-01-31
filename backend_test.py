#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Adverlyx Digital
Tests all endpoints as specified in the review request.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://growthlyx.preview.emergentagent.com/api"
TIMEOUT = 30

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.access_token = None
        self.admin_token = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, use_auth: bool = False, use_admin_auth: bool = False) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{BASE_URL}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
            
        if use_auth and self.access_token:
            request_headers["Authorization"] = f"Bearer {self.access_token}"
        elif use_admin_auth and self.admin_token:
            request_headers["Authorization"] = f"Bearer {self.admin_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=request_headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
                
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("=== TESTING HEALTH ENDPOINTS ===")
        
        # Test root endpoint
        success, data, status = self.make_request("GET", "/")
        if success and isinstance(data, dict) and data.get("status") == "healthy":
            self.log_result("GET /api/", True, f"API status: {data.get('status')}")
        else:
            self.log_result("GET /api/", False, f"Status: {status}", data)
        
        # Test health endpoint
        success, data, status = self.make_request("GET", "/health")
        if success and isinstance(data, dict) and data.get("status") == "healthy":
            self.log_result("GET /api/health", True, f"Database: {data.get('database')}")
        else:
            self.log_result("GET /api/health", False, f"Status: {status}", data)
    
    def test_public_endpoints(self):
        """Test public API endpoints"""
        print("=== TESTING PUBLIC ENDPOINTS ===")
        
        endpoints = [
            ("/public/plans", "pricing plans"),
            ("/public/stats", "platform stats"),
            ("/public/testimonials", "testimonials"),
            ("/public/faqs", "FAQs"),
            ("/public/reviews", "reviews")
        ]
        
        for endpoint, description in endpoints:
            success, data, status = self.make_request("GET", endpoint)
            if success and data:
                self.log_result(f"GET /api{endpoint}", True, f"Retrieved {description}")
            else:
                self.log_result(f"GET /api{endpoint}", False, f"Status: {status}", data)
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("=== TESTING AUTHENTICATION ===")
        
        # Test user registration
        register_data = {
            "email": "newtest@example.com",
            "name": "New Test",
            "password": "Test123!"
        }
        
        success, data, status = self.make_request("POST", "/auth/register", register_data)
        if success and isinstance(data, dict) and "user_id" in data:
            self.log_result("POST /api/auth/register", True, "User registered successfully")
        else:
            # Check if user already exists
            if status == 400 and "already registered" in str(data):
                self.log_result("POST /api/auth/register", True, "User already exists (expected)")
            else:
                self.log_result("POST /api/auth/register", False, f"Status: {status}", data)
        
        # Test user login (existing user)
        login_data = {
            "email": "test@example.com",
            "password": "Test123!"
        }
        
        success, data, status = self.make_request("POST", "/auth/login", login_data)
        if success and isinstance(data, dict) and "access_token" in data:
            self.access_token = data["access_token"]
            self.log_result("POST /api/auth/login", True, "Login successful, token obtained")
        else:
            self.log_result("POST /api/auth/login", False, f"Status: {status}", data)
        
        # Test get current user (requires auth)
        if self.access_token:
            success, data, status = self.make_request("GET", "/auth/me", use_auth=True)
            if success and isinstance(data, dict) and "email" in data:
                self.log_result("GET /api/auth/me", True, f"User: {data.get('email')}")
            else:
                self.log_result("GET /api/auth/me", False, f"Status: {status}", data)
        
        # Test forgot password
        forgot_data = {"email": "test@example.com"}
        success, data, status = self.make_request("POST", "/auth/forgot-password", forgot_data)
        if success and isinstance(data, dict) and "message" in data:
            self.log_result("POST /api/auth/forgot-password", True, "Password reset requested")
        else:
            self.log_result("POST /api/auth/forgot-password", False, f"Status: {status}", data)
    
    def test_admin_authentication(self):
        """Test admin login"""
        print("=== TESTING ADMIN AUTHENTICATION ===")
        
        admin_login_data = {
            "email": "admin@adverlyx.com",
            "password": "Admin123!"
        }
        
        success, data, status = self.make_request("POST", "/auth/login", admin_login_data)
        if success and isinstance(data, dict) and "access_token" in data:
            self.admin_token = data["access_token"]
            self.log_result("Admin Login", True, "Admin login successful, token obtained")
        else:
            self.log_result("Admin Login", False, f"Status: {status}", data)
    
    def test_subscriptions(self):
        """Test subscription endpoints"""
        print("=== TESTING SUBSCRIPTIONS ===")
        
        if not self.access_token:
            self.log_result("Subscriptions Test", False, "No auth token available")
            return
        
        # Test get plans
        success, data, status = self.make_request("GET", "/subscriptions/plans", use_auth=True)
        if success and isinstance(data, list) and len(data) > 0:
            self.log_result("GET /api/subscriptions/plans", True, f"Retrieved {len(data)} plans")
        else:
            self.log_result("GET /api/subscriptions/plans", False, f"Status: {status}", data)
        
        # Test get current subscription
        success, data, status = self.make_request("GET", "/subscriptions/current", use_auth=True)
        if success:
            if data is None:
                self.log_result("GET /api/subscriptions/current", True, "No active subscription (expected)")
            else:
                self.log_result("GET /api/subscriptions/current", True, f"Active subscription: {data.get('plan')}")
        else:
            self.log_result("GET /api/subscriptions/current", False, f"Status: {status}", data)
        
        # Test create subscription
        sub_data = {
            "plan": "basic",
            "billing_cycle": "monthly"
        }
        
        success, data, status = self.make_request("POST", "/subscriptions/subscribe", sub_data, use_auth=True)
        if success and isinstance(data, dict) and "id" in data:
            self.log_result("POST /api/subscriptions/subscribe", True, f"Subscription created: {data.get('plan')}")
        else:
            # Check if already has subscription
            if status == 400 and "already have" in str(data):
                self.log_result("POST /api/subscriptions/subscribe", True, "User already has subscription (expected)")
            else:
                self.log_result("POST /api/subscriptions/subscribe", False, f"Status: {status}", data)
    
    def test_instagram_endpoints(self):
        """Test Instagram account endpoints"""
        print("=== TESTING INSTAGRAM ENDPOINTS ===")
        
        if not self.access_token:
            self.log_result("Instagram Test", False, "No auth token available")
            return
        
        # Test connect Instagram
        connect_data = {
            "username": "testuser123",
            "risk_disclaimer_accepted": True
        }
        
        success, data, status = self.make_request("POST", "/instagram/connect", connect_data, use_auth=True)
        if success and isinstance(data, dict) and "username" in data:
            self.log_result("POST /api/instagram/connect", True, f"Connected: @{data.get('username')}")
        else:
            # Check if already connected
            if status == 400 and "already" in str(data):
                self.log_result("POST /api/instagram/connect", True, "Account already connected (expected)")
            else:
                self.log_result("POST /api/instagram/connect", False, f"Status: {status}", data)
        
        # Test get account
        success, data, status = self.make_request("GET", "/instagram/account", use_auth=True)
        if success:
            if data is None:
                self.log_result("GET /api/instagram/account", True, "No connected account")
            else:
                self.log_result("GET /api/instagram/account", True, f"Account: @{data.get('username')}")
        else:
            self.log_result("GET /api/instagram/account", False, f"Status: {status}", data)
        
        # Test get stats
        success, data, status = self.make_request("GET", "/instagram/stats", use_auth=True)
        if success and isinstance(data, dict):
            self.log_result("GET /api/instagram/stats", True, f"Followers: {data.get('followers_count', 0)}")
        else:
            # Expected if no account connected
            if status == 404:
                self.log_result("GET /api/instagram/stats", True, "No account connected (expected)")
            else:
                self.log_result("GET /api/instagram/stats", False, f"Status: {status}", data)
        
        # Test update account settings
        update_data = {"growth_paused": True}
        success, data, status = self.make_request("PUT", "/instagram/account", update_data, use_auth=True)
        if success and isinstance(data, dict):
            self.log_result("PUT /api/instagram/account", True, f"Growth paused: {data.get('growth_paused')}")
        else:
            if status == 404:
                self.log_result("PUT /api/instagram/account", True, "No account to update (expected)")
            else:
                self.log_result("PUT /api/instagram/account", False, f"Status: {status}", data)
        
        # Test get targeting
        success, data, status = self.make_request("GET", "/instagram/targeting", use_auth=True)
        if success:
            if data is None:
                self.log_result("GET /api/instagram/targeting", True, "No targeting settings")
            else:
                self.log_result("GET /api/instagram/targeting", True, f"Niche: {data.get('niche', 'None')}")
        else:
            self.log_result("GET /api/instagram/targeting", False, f"Status: {status}", data)
        
        # Test update targeting
        targeting_data = {
            "niche": "Fashion",
            "locations": ["USA", "UK"]
        }
        success, data, status = self.make_request("PUT", "/instagram/targeting", targeting_data, use_auth=True)
        if success and isinstance(data, dict):
            self.log_result("PUT /api/instagram/targeting", True, f"Updated niche: {data.get('niche')}")
        else:
            if status == 404:
                self.log_result("PUT /api/instagram/targeting", True, "No targeting settings to update (expected)")
            else:
                self.log_result("PUT /api/instagram/targeting", False, f"Status: {status}", data)
    
    def test_support_tickets(self):
        """Test support ticket endpoints"""
        print("=== TESTING SUPPORT TICKETS ===")
        
        if not self.access_token:
            self.log_result("Tickets Test", False, "No auth token available")
            return
        
        # Test create ticket
        ticket_data = {
            "subject": "Test ticket",
            "message": "This is a test",
            "category": "technical"
        }
        
        success, data, status = self.make_request("POST", "/tickets/", ticket_data, use_auth=True)
        if success and isinstance(data, dict) and "id" in data:
            self.log_result("POST /api/tickets/", True, f"Ticket created: {data.get('subject')}")
        else:
            self.log_result("POST /api/tickets/", False, f"Status: {status}", data)
        
        # Test get tickets
        success, data, status = self.make_request("GET", "/tickets/", use_auth=True)
        if success and isinstance(data, list):
            self.log_result("GET /api/tickets/", True, f"Retrieved {len(data)} tickets")
        else:
            self.log_result("GET /api/tickets/", False, f"Status: {status}", data)
    
    def test_notifications(self):
        """Test notification endpoints"""
        print("=== TESTING NOTIFICATIONS ===")
        
        if not self.access_token:
            self.log_result("Notifications Test", False, "No auth token available")
            return
        
        # Test get notifications
        success, data, status = self.make_request("GET", "/notifications/", use_auth=True)
        if success and isinstance(data, list):
            self.log_result("GET /api/notifications/", True, f"Retrieved {len(data)} notifications")
        else:
            self.log_result("GET /api/notifications/", False, f"Status: {status}", data)
        
        # Test get unread count
        success, data, status = self.make_request("GET", "/notifications/unread-count", use_auth=True)
        if success and isinstance(data, dict) and "unread_count" in data:
            self.log_result("GET /api/notifications/unread-count", True, f"Unread: {data.get('unread_count')}")
        else:
            self.log_result("GET /api/notifications/unread-count", False, f"Status: {status}", data)
    
    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("=== TESTING ADMIN ENDPOINTS ===")
        
        if not self.admin_token:
            self.log_result("Admin Test", False, "No admin token available")
            return
        
        # Test admin dashboard
        success, data, status = self.make_request("GET", "/admin/dashboard", use_admin_auth=True)
        if success and isinstance(data, dict) and "total_users" in data:
            self.log_result("GET /api/admin/dashboard", True, f"Total users: {data.get('total_users')}")
        else:
            self.log_result("GET /api/admin/dashboard", False, f"Status: {status}", data)
        
        # Test get all users
        success, data, status = self.make_request("GET", "/admin/users", use_admin_auth=True)
        if success and isinstance(data, list):
            self.log_result("GET /api/admin/users", True, f"Retrieved {len(data)} users")
        else:
            self.log_result("GET /api/admin/users", False, f"Status: {status}", data)
        
        # Test get all subscriptions
        success, data, status = self.make_request("GET", "/admin/subscriptions", use_admin_auth=True)
        if success and isinstance(data, list):
            self.log_result("GET /api/admin/subscriptions", True, f"Retrieved {len(data)} subscriptions")
        else:
            self.log_result("GET /api/admin/subscriptions", False, f"Status: {status}", data)
        
        # Test get all payments
        success, data, status = self.make_request("GET", "/admin/payments", use_admin_auth=True)
        if success and isinstance(data, list):
            self.log_result("GET /api/admin/payments", True, f"Retrieved {len(data)} payments")
        else:
            self.log_result("GET /api/admin/payments", False, f"Status: {status}", data)
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"Starting API tests for: {BASE_URL}")
        print("=" * 60)
        
        self.test_health_endpoints()
        self.test_public_endpoints()
        self.test_authentication()
        self.test_admin_authentication()
        self.test_subscriptions()
        self.test_instagram_endpoints()
        self.test_support_tickets()
        self.test_notifications()
        self.test_admin_endpoints()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)