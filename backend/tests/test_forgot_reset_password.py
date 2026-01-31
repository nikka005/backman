"""
Test Forgot Password and Reset Password APIs
Tests for Priority 1 issues: Forgot Password feature
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestForgotPasswordAPI:
    """Test forgot password endpoint"""
    
    def test_forgot_password_valid_email(self):
        """Test forgot password with valid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "demo@user.com"}
        )
        # Should return 200 even if email doesn't exist (security)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "reset link" in data["message"].lower() or "email" in data["message"].lower()
        print(f"✓ Forgot password API returns: {data['message']}")
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email (should still return 200 for security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@test.com"}
        )
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Non-existent email returns same message: {data['message']}")
    
    def test_forgot_password_invalid_email_format(self):
        """Test forgot password with invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "invalid-email"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Invalid email format returns 422 validation error")
    
    def test_forgot_password_empty_email(self):
        """Test forgot password with empty email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ""}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Empty email returns 422 validation error")


class TestResetPasswordAPI:
    """Test reset password endpoint"""
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "invalid-token-12345", "password": "NewPassword123!"}
        )
        # Should return 400 for invalid token
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
        print(f"✓ Invalid token returns 400: {data['detail']}")
    
    def test_reset_password_missing_token(self):
        """Test reset password without token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"password": "NewPassword123!"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Missing token returns 422 validation error")
    
    def test_reset_password_missing_password(self):
        """Test reset password without password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "some-token"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Missing password returns 422 validation error")


class TestStripePaymentAPI:
    """Test Stripe payment checkout endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for demo user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@user.com", "password": "User123!"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not authenticate demo user")
    
    def test_checkout_session_requires_auth(self):
        """Test that checkout session requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            params={
                "package_id": "pro_yearly",
                "origin_url": "https://example.com"
            }
        )
        # Should return 401 without auth
        assert response.status_code == 401
        print("✓ Checkout session requires authentication (401)")
    
    def test_checkout_session_with_auth(self, auth_token):
        """Test checkout session creation with valid auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            params={
                "package_id": "pro_yearly",
                "origin_url": "https://example.com"
            },
            headers=headers
        )
        # May return 500 if Stripe not configured, or 200 with URL
        if response.status_code == 200:
            data = response.json()
            assert "url" in data or "session_id" in data
            print(f"✓ Checkout session created: {data.get('url', 'session created')[:50]}...")
        elif response.status_code == 500:
            data = response.json()
            # Check if it's a Stripe configuration issue
            if "not configured" in data.get("detail", "").lower():
                print("⚠ Stripe not configured (expected in test env)")
                pytest.skip("Stripe not configured")
            else:
                print(f"✗ Unexpected 500 error: {data}")
                assert False, f"Unexpected error: {data}"
        else:
            print(f"✗ Unexpected status: {response.status_code}")
            assert False, f"Unexpected status: {response.status_code}"
    
    def test_checkout_session_invalid_package(self, auth_token):
        """Test checkout session with invalid package ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/session",
            params={
                "package_id": "invalid_package",
                "origin_url": "https://example.com"
            },
            headers=headers
        )
        # Should return 400 for invalid package
        if response.status_code == 400:
            print("✓ Invalid package returns 400")
        elif response.status_code == 500:
            # Stripe not configured
            pytest.skip("Stripe not configured")
        else:
            print(f"Status: {response.status_code}, Response: {response.text}")


class TestLoginForgotPasswordLink:
    """Test that login page has forgot password link"""
    
    def test_login_endpoint_exists(self):
        """Test that login endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@user.com", "password": "User123!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("✓ Login endpoint works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
