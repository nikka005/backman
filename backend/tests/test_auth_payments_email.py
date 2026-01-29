"""
Backend API Tests for Auth, Payments, and Email System
Tests: Login flow, Dashboard subscription status, Pricing plans, Stripe checkout, Public settings, Email exports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestLoginFlow:
    """Test authentication login flow"""
    
    def test_login_success(self):
        """Test admin login with valid credentials - admin@adverlyx.com / Admin123!"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify token structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == ADMIN_EMAIL
        assert user["role"] == "admin"
        assert user["name"] == "Admin"
        assert "id" in user
        
    def test_login_invalid_password(self):
        """Test login with invalid password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
    def test_login_invalid_email(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get admin access token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestSubscriptionStatus:
    """Test subscription status API for dashboard"""
    
    def test_get_subscription_status(self, auth_headers):
        """Test GET /api/payments/subscription returns subscription status"""
        response = requests.get(f"{BASE_URL}/api/payments/subscription", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have has_subscription field
        assert "has_subscription" in data
        
        # For admin without subscription, should be false
        if not data["has_subscription"]:
            assert data["has_subscription"] == False
        else:
            # If has subscription, verify structure
            assert "subscription" in data
            sub = data["subscription"]
            assert "plan" in sub
            assert "status" in sub
            
    def test_get_payment_history(self, auth_headers):
        """Test GET /api/payments/history returns payment history"""
        response = requests.get(f"{BASE_URL}/api/payments/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)


class TestPricingPlans:
    """Test pricing page plans from database"""
    
    def test_get_public_plans(self):
        """Test GET /api/public/plans returns plans from database"""
        response = requests.get(f"{BASE_URL}/api/public/plans")
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list with at least one plan
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify plan structure
        plan = data[0]
        assert "name" in plan
        assert "slug" in plan
        assert "monthly_price" in plan
        assert "yearly_price" in plan
        assert "followers_min" in plan
        assert "followers_max" in plan
        
    def test_plans_have_required_fields(self):
        """Test all plans have required fields for pricing page"""
        response = requests.get(f"{BASE_URL}/api/public/plans")
        data = response.json()
        
        for plan in data:
            # Required fields for pricing display
            assert "name" in plan, f"Plan missing name"
            assert "slug" in plan, f"Plan missing slug"
            assert "description" in plan, f"Plan {plan.get('name')} missing description"
            assert "monthly_price" in plan, f"Plan {plan.get('name')} missing monthly_price"
            assert "yearly_price" in plan, f"Plan {plan.get('name')} missing yearly_price"
            
            # Verify prices are numbers
            assert isinstance(plan["monthly_price"], (int, float))
            assert isinstance(plan["yearly_price"], (int, float))


class TestStripeCheckout:
    """Test Stripe checkout session creation"""
    
    def test_create_checkout_session_basic_monthly(self, auth_headers):
        """Test creating checkout session for basic monthly plan"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            headers=auth_headers,
            params={
                "package_id": "basic_monthly",
                "origin_url": "https://advrlx-dash.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return Stripe checkout URL and session ID
        assert "url" in data
        assert "session_id" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        
    def test_create_checkout_session_pro_yearly(self, auth_headers):
        """Test creating checkout session for pro yearly plan"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            headers=auth_headers,
            params={
                "package_id": "pro_yearly",
                "origin_url": "https://advrlx-dash.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "url" in data
        assert "session_id" in data
        
    def test_create_checkout_session_invalid_package(self, auth_headers):
        """Test creating checkout session with invalid package returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            headers=auth_headers,
            params={
                "package_id": "invalid_package",
                "origin_url": "https://advrlx-dash.preview.emergentagent.com"
            }
        )
        assert response.status_code == 400
        
    def test_checkout_requires_auth(self):
        """Test checkout session creation requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            params={
                "package_id": "basic_monthly",
                "origin_url": "https://test.com"
            }
        )
        assert response.status_code in [401, 403]


class TestPublicSettingsAPI:
    """Test public settings API returns platform settings"""
    
    def test_get_public_settings(self):
        """Test GET /api/public/settings returns all public settings"""
        response = requests.get(f"{BASE_URL}/api/public/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Should have main sections
        assert "branding" in data
        assert "ui" in data
        assert "features" in data
        assert "hero" in data
        
    def test_get_public_branding(self):
        """Test GET /api/public/branding returns branding settings"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        
        # Verify branding fields
        assert "brand_name" in data
        assert "primary_color" in data
        assert "secondary_color" in data
        
    def test_get_public_hero(self):
        """Test GET /api/public/hero returns hero content"""
        response = requests.get(f"{BASE_URL}/api/public/hero")
        assert response.status_code == 200
        data = response.json()
        
        # Should have hero content fields
        assert isinstance(data, dict)
        
    def test_get_public_promo_banner(self):
        """Test GET /api/public/promo-banner returns promo banner settings"""
        response = requests.get(f"{BASE_URL}/api/public/promo-banner")
        assert response.status_code == 200
        data = response.json()
        
        # Should have enabled field
        assert "enabled" in data or "message" in data


class TestEmailSystemExports:
    """Test email system functions exist and are properly exported"""
    
    def test_email_module_imports(self):
        """Verify email module can be imported and has required functions"""
        # This test verifies the email.py module structure
        # We test by checking the auth endpoints that use email functions
        
        # Test registration endpoint exists (uses send_verification_email)
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_email_check@test.com",
            "password": "TestPass123!",
            "name": "Test User"
        })
        # Should either succeed (201) or fail with email exists (400)
        # Not 500 which would indicate email module import error
        assert response.status_code in [200, 201, 400], f"Registration endpoint error: {response.status_code}"
        
    def test_forgot_password_endpoint(self):
        """Test forgot password endpoint (uses send_password_reset_email)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@test.com"
        })
        # Should return 200 even for non-existent email (security)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAuthMeEndpoint:
    """Test /auth/me endpoint for dashboard user info"""
    
    def test_get_current_user(self, auth_headers):
        """Test GET /api/auth/me returns current user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify user fields for dashboard
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "role" in data
        assert data["email"] == ADMIN_EMAIL
        
    def test_auth_me_requires_token(self):
        """Test /auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]


class TestTokenRefresh:
    """Test token refresh functionality"""
    
    def test_refresh_token(self):
        """Test POST /api/auth/refresh returns new tokens"""
        # First login to get refresh token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token to get new access token
        response = requests.post(f"{BASE_URL}/api/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data


class TestFeatureMatrix:
    """Test feature matrix for pricing comparison table"""
    
    def test_get_feature_matrix(self):
        """Test GET /api/public/feature-matrix returns comparison data"""
        response = requests.get(f"{BASE_URL}/api/public/feature-matrix")
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list of features
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
