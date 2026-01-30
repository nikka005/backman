"""
Test suite for Checkout and Coupon functionality
Tests: Coupon validation API, Admin coupon management, Checkout flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "demo@user.com"
USER_PASSWORD = "User123!"
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestCouponValidation:
    """Test coupon validation API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_validate_welcome20_coupon(self):
        """Test WELCOME20 coupon - 20% off"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "WELCOME20", "plan_slug": "pro"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "WELCOME20"
        assert data["discount_percent"] == 20
        assert "20%" in data["message"] or "Welcome" in data["message"]
    
    def test_validate_first50_coupon(self):
        """Test FIRST50 coupon - 50% off"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "FIRST50", "plan_slug": "basic"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "FIRST50"
        assert data["discount_percent"] == 50
    
    def test_validate_adverlyx10_coupon(self):
        """Test ADVERLYX10 coupon - 10% off"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "ADVERLYX10", "plan_slug": "enterprise"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 10
    
    def test_validate_growth25_coupon(self):
        """Test GROWTH25 coupon - 25% off"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "GROWTH25", "plan_slug": "pro"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 25
    
    def test_validate_invalid_coupon(self):
        """Test invalid coupon code"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "INVALIDCODE123", "plan_slug": "pro"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "Invalid" in data["message"] or "expired" in data["message"]
    
    def test_validate_coupon_case_insensitive(self):
        """Test coupon validation is case insensitive"""
        response = requests.post(
            f"{BASE_URL}/api/payments/coupon/validate",
            headers=self.headers,
            json={"code": "welcome20", "plan_slug": "pro"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 20


class TestAdminCouponManagement:
    """Test admin coupon CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        # Try admin login endpoint first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin login failed - skipping admin tests")
    
    def test_get_all_coupons(self):
        """Test getting all coupons (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/payments/admin/coupons",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_coupon(self):
        """Test creating a new coupon"""
        import uuid
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/coupons",
            headers=self.headers,
            json={
                "code": unique_code,
                "description": "Test coupon for automated testing",
                "discount_percent": 15,
                "discount_amount": 0,
                "max_uses": 100,
                "valid_plans": ["pro", "enterprise"],
                "expires_at": None
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "coupon" in data or "message" in data
        
        # Store coupon ID for cleanup
        if "coupon" in data:
            self.created_coupon_id = data["coupon"].get("id")
    
    def test_create_duplicate_coupon_fails(self):
        """Test that creating duplicate coupon code fails"""
        # First create a coupon
        import uuid
        unique_code = f"DUP{uuid.uuid4().hex[:6].upper()}"
        
        response1 = requests.post(
            f"{BASE_URL}/api/payments/admin/coupons",
            headers=self.headers,
            json={
                "code": unique_code,
                "description": "First coupon",
                "discount_percent": 10
            }
        )
        assert response1.status_code == 200
        
        # Try to create same code again
        response2 = requests.post(
            f"{BASE_URL}/api/payments/admin/coupons",
            headers=self.headers,
            json={
                "code": unique_code,
                "description": "Duplicate coupon",
                "discount_percent": 20
            }
        )
        assert response2.status_code == 400
        assert "exists" in response2.json().get("detail", "").lower()


class TestPaymentEndpoints:
    """Test payment-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_subscription_status(self):
        """Test getting current subscription status"""
        response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "has_subscription" in data
    
    def test_get_payment_history(self):
        """Test getting payment history"""
        response = requests.get(
            f"{BASE_URL}/api/payments/history",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTargetingDisplay:
    """Test targeting settings display on dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_targeting_settings(self):
        """Test getting targeting settings"""
        response = requests.get(
            f"{BASE_URL}/api/instagram/targeting",
            headers=self.headers
        )
        # May return 404 if no Instagram account connected
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            # Check that targeting fields exist
            assert "niche" in data or data == {}
    
    def test_update_targeting_settings(self):
        """Test updating targeting settings"""
        # First check if user has Instagram account
        ig_response = requests.get(
            f"{BASE_URL}/api/instagram/account",
            headers=self.headers
        )
        
        if ig_response.status_code != 200:
            pytest.skip("No Instagram account connected")
        
        response = requests.put(
            f"{BASE_URL}/api/instagram/targeting",
            headers=self.headers,
            json={
                "niche": "Test Niche",
                "locations": ["USA", "UK"],
                "competitor_accounts": ["competitor1", "competitor2"],
                "hashtags": ["test", "automation"]
            }
        )
        assert response.status_code in [200, 201]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
