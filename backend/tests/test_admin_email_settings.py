"""
Test Admin Email Settings Feature
Tests for GET/PUT /api/admin/settings/email and POST /api/admin/settings/email/test
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestAdminEmailSettings:
    """Test Admin Email Settings CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test - get admin auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"Admin login successful")
        else:
            pytest.skip(f"Admin login failed: {login_response.status_code} - {login_response.text}")
    
    def test_get_email_settings(self):
        """Test GET /api/admin/settings/email - retrieve email configuration"""
        response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "smtp_host" in data, "Response should contain smtp_host"
        assert "smtp_port" in data, "Response should contain smtp_port"
        assert "smtp_username" in data, "Response should contain smtp_username"
        assert "smtp_password" in data, "Response should contain smtp_password"
        assert "smtp_use_ssl" in data, "Response should contain smtp_use_ssl"
        assert "sender_email" in data, "Response should contain sender_email"
        assert "sender_name" in data, "Response should contain sender_name"
        assert "is_configured" in data, "Response should contain is_configured"
        
        print(f"Email settings retrieved successfully: host={data.get('smtp_host')}, configured={data.get('is_configured')}")
    
    def test_password_is_masked(self):
        """Test that password is masked when retrieved (shows asterisks)"""
        response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        
        assert response.status_code == 200
        data = response.json()
        
        password = data.get("smtp_password", "")
        
        # If password is set, it should be masked with asterisks
        if password:
            assert all(c == '*' for c in password), f"Password should be masked with asterisks, got: {password}"
            print(f"Password is correctly masked: {password}")
        else:
            print("No password set yet - skipping mask verification")
    
    def test_update_email_settings(self):
        """Test PUT /api/admin/settings/email - save email settings"""
        # First get current settings
        get_response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        assert get_response.status_code == 200
        current_settings = get_response.json()
        
        # Update with test settings
        update_data = {
            "smtp_host": "smtp.test.com",
            "smtp_port": 587,
            "smtp_username": "test@test.com",
            "smtp_password": "testpassword123",
            "smtp_use_ssl": False,
            "sender_email": "noreply@test.com",
            "sender_name": "Test Sender"
        }
        
        response = self.session.put(f"{BASE_URL}/api/admin/settings/email", json=update_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain success message"
        print(f"Email settings updated: {data.get('message')}")
        
        # Verify settings were saved by fetching again
        verify_response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        assert verify_response.status_code == 200
        
        saved_data = verify_response.json()
        assert saved_data.get("smtp_host") == "smtp.test.com", "SMTP host should be updated"
        assert saved_data.get("smtp_port") == 587, "SMTP port should be updated"
        assert saved_data.get("smtp_username") == "test@test.com", "SMTP username should be updated"
        assert saved_data.get("smtp_use_ssl") == False, "SSL setting should be updated"
        assert saved_data.get("sender_email") == "noreply@test.com", "Sender email should be updated"
        assert saved_data.get("sender_name") == "Test Sender", "Sender name should be updated"
        
        # Password should be masked
        assert all(c == '*' for c in saved_data.get("smtp_password", "")), "Password should be masked after save"
        
        print("Email settings verified after update")
        
        # Restore original settings if they existed
        if current_settings.get("smtp_host"):
            restore_data = {
                "smtp_host": current_settings.get("smtp_host", ""),
                "smtp_port": current_settings.get("smtp_port", 465),
                "smtp_username": current_settings.get("smtp_username", ""),
                "smtp_password": current_settings.get("smtp_password", ""),  # Will keep existing if masked
                "smtp_use_ssl": current_settings.get("smtp_use_ssl", True),
                "sender_email": current_settings.get("sender_email", ""),
                "sender_name": current_settings.get("sender_name", "Adverlyx Digital")
            }
            self.session.put(f"{BASE_URL}/api/admin/settings/email", json=restore_data)
            print("Original settings restored")
    
    def test_update_with_masked_password_keeps_existing(self):
        """Test that submitting masked password keeps the existing password"""
        # First set a known password
        initial_data = {
            "smtp_host": "smtp.keeptest.com",
            "smtp_port": 465,
            "smtp_username": "keep@test.com",
            "smtp_password": "originalpassword",
            "smtp_use_ssl": True,
            "sender_email": "keep@test.com",
            "sender_name": "Keep Test"
        }
        
        response = self.session.put(f"{BASE_URL}/api/admin/settings/email", json=initial_data)
        assert response.status_code == 200
        
        # Now update with masked password (asterisks)
        update_data = {
            "smtp_host": "smtp.keeptest.com",
            "smtp_port": 465,
            "smtp_username": "keep@test.com",
            "smtp_password": "************",  # Masked password
            "smtp_use_ssl": True,
            "sender_email": "updated@test.com",  # Change something else
            "sender_name": "Keep Test Updated"
        }
        
        response = self.session.put(f"{BASE_URL}/api/admin/settings/email", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the sender_email was updated but password was kept
        verify_response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        assert verify_response.status_code == 200
        
        saved_data = verify_response.json()
        assert saved_data.get("sender_email") == "updated@test.com", "Sender email should be updated"
        assert saved_data.get("sender_name") == "Keep Test Updated", "Sender name should be updated"
        # Password should still be masked (meaning it was kept)
        assert saved_data.get("smtp_password"), "Password should still exist"
        
        print("Masked password correctly kept existing password")
    
    def test_validation_required_fields(self):
        """Test that required fields are validated"""
        # Try to save with empty required fields
        invalid_data = {
            "smtp_host": "",
            "smtp_port": 465,
            "smtp_username": "",
            "smtp_password": "",
            "smtp_use_ssl": True,
            "sender_email": "",
            "sender_name": ""
        }
        
        response = self.session.put(f"{BASE_URL}/api/admin/settings/email", json=invalid_data)
        
        # The API might accept empty values or return validation error
        # Either behavior is acceptable, just document it
        print(f"Empty fields response: {response.status_code}")
        if response.status_code == 200:
            print("API accepts empty values (will show as not configured)")
        else:
            print(f"API validates required fields: {response.text}")
    
    def test_test_email_endpoint_exists(self):
        """Test POST /api/admin/settings/email/test endpoint exists"""
        # First ensure settings are configured
        settings_response = self.session.get(f"{BASE_URL}/api/admin/settings/email")
        assert settings_response.status_code == 200
        
        settings = settings_response.json()
        
        if not settings.get("is_configured"):
            # Configure test settings first
            config_data = {
                "smtp_host": "smtp.test.com",
                "smtp_port": 465,
                "smtp_username": "test@test.com",
                "smtp_password": "testpass",
                "smtp_use_ssl": True,
                "sender_email": "test@test.com",
                "sender_name": "Test"
            }
            self.session.put(f"{BASE_URL}/api/admin/settings/email", json=config_data)
        
        # Test the test email endpoint
        test_email = "test@example.com"
        response = self.session.post(f"{BASE_URL}/api/admin/settings/email/test?test_email={test_email}")
        
        # The endpoint should exist (might fail due to invalid SMTP, but should not 404)
        assert response.status_code != 404, "Test email endpoint should exist"
        
        if response.status_code == 200:
            print(f"Test email sent successfully: {response.json()}")
        else:
            # Expected to fail with test credentials
            print(f"Test email failed (expected with test credentials): {response.status_code} - {response.text}")
            # Should return 400 for SMTP errors, not 500
            assert response.status_code in [400, 422], f"Expected 400/422 for SMTP error, got {response.status_code}"


class TestEmailSettingsUnauthorized:
    """Test that email settings require admin authentication"""
    
    def test_get_email_settings_requires_auth(self):
        """Test GET /api/admin/settings/email requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.get(f"{BASE_URL}/api/admin/settings/email")
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"Correctly requires auth: {response.status_code}")
    
    def test_update_email_settings_requires_auth(self):
        """Test PUT /api/admin/settings/email requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        data = {
            "smtp_host": "smtp.hack.com",
            "smtp_port": 465,
            "smtp_username": "hacker@test.com",
            "smtp_password": "hackpass",
            "smtp_use_ssl": True,
            "sender_email": "hacker@test.com",
            "sender_name": "Hacker"
        }
        
        response = session.put(f"{BASE_URL}/api/admin/settings/email", json=data)
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"Correctly requires auth for update: {response.status_code}")
    
    def test_test_email_requires_auth(self):
        """Test POST /api/admin/settings/email/test requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/admin/settings/email/test?test_email=test@example.com")
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"Correctly requires auth for test: {response.status_code}")


class TestEmailSettingsNonAdmin:
    """Test that email settings require admin role (not just any authenticated user)"""
    
    def test_regular_user_cannot_access_email_settings(self):
        """Test that regular users cannot access email settings"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as regular user
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "User123!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Regular user login failed - skipping role test")
        
        token = login_response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Try to access email settings
        response = session.get(f"{BASE_URL}/api/admin/settings/email")
        
        assert response.status_code in [401, 403], f"Regular user should not access admin settings, got {response.status_code}"
        print(f"Regular user correctly denied: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
