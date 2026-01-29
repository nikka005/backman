"""
Feature Management API Tests for Adverlyx Digital
Tests all CRUD operations for Pages, Sections, Platform Features, Payments, and Auth Options
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestFeatureManagementAuth:
    """Test authentication for feature management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_admin_login(self, auth_token):
        """Test admin can login successfully"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Admin login successful, token length: {len(auth_token)}")


class TestFeatureInitialization:
    """Test feature initialization endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_initialize_features(self, auth_headers):
        """Test POST /api/admin/feature-management/initialize"""
        response = requests.post(
            f"{BASE_URL}/api/admin/feature-management/initialize",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Initialize failed: {response.text}"
        data = response.json()
        # Should return counts of initialized features
        assert "pages" in data or "message" in data
        print(f"✓ Features initialized: {data}")


class TestFeaturePages:
    """Test Pages feature management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_pages(self, auth_headers):
        """Test GET /api/admin/feature-management/pages"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/pages",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get pages failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} pages")
        
        # Verify page structure
        if len(data) > 0:
            page = data[0]
            assert "key" in page, "Page should have 'key'"
            assert "name" in page, "Page should have 'name'"
            assert "enabled" in page, "Page should have 'enabled'"
            print(f"✓ First page: {page.get('name')} (key: {page.get('key')})")
    
    def test_get_single_page(self, auth_headers):
        """Test GET /api/admin/feature-management/pages/{key}"""
        # First get all pages to find a valid key
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/pages",
            headers=auth_headers
        )
        pages = response.json()
        
        if len(pages) > 0:
            page_key = pages[0]["key"]
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/pages/{page_key}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Get page failed: {response.text}"
            page = response.json()
            assert page["key"] == page_key
            print(f"✓ Got page details for: {page.get('name')}")
    
    def test_update_page(self, auth_headers):
        """Test PUT /api/admin/feature-management/pages/{key}"""
        # Get a page to update
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/pages",
            headers=auth_headers
        )
        pages = response.json()
        
        if len(pages) > 0:
            page = pages[0]
            page_key = page["key"]
            original_description = page.get("description", "")
            
            # Update the page
            update_data = {
                **page,
                "description": "TEST_Updated description for testing"
            }
            response = requests.put(
                f"{BASE_URL}/api/admin/feature-management/pages/{page_key}",
                headers=auth_headers,
                json=update_data
            )
            assert response.status_code == 200, f"Update page failed: {response.text}"
            
            # Verify update
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/pages/{page_key}",
                headers=auth_headers
            )
            updated_page = response.json()
            assert updated_page["description"] == "TEST_Updated description for testing"
            print(f"✓ Page updated successfully")
            
            # Restore original
            update_data["description"] = original_description
            requests.put(
                f"{BASE_URL}/api/admin/feature-management/pages/{page_key}",
                headers=auth_headers,
                json=update_data
            )


class TestFeatureSections:
    """Test Sections feature management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_sections(self, auth_headers):
        """Test GET /api/admin/feature-management/sections"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/sections",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get sections failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} sections")
        
        if len(data) > 0:
            section = data[0]
            assert "key" in section
            assert "name" in section
            print(f"✓ First section: {section.get('name')}")
    
    def test_get_single_section(self, auth_headers):
        """Test GET /api/admin/feature-management/sections/{key}"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/sections",
            headers=auth_headers
        )
        sections = response.json()
        
        if len(sections) > 0:
            section_key = sections[0]["key"]
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/sections/{section_key}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Get section failed: {response.text}"
            section = response.json()
            assert section["key"] == section_key
            print(f"✓ Got section details for: {section.get('name')}")


class TestPlatformFeatures:
    """Test Platform Features management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_platform_features(self, auth_headers):
        """Test GET /api/admin/feature-management/platform"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/platform",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get platform features failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} platform features")
        
        if len(data) > 0:
            feature = data[0]
            assert "key" in feature
            assert "name" in feature
            print(f"✓ First platform feature: {feature.get('name')}")
    
    def test_get_single_platform_feature(self, auth_headers):
        """Test GET /api/admin/feature-management/platform/{key}"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/platform",
            headers=auth_headers
        )
        features = response.json()
        
        if len(features) > 0:
            feature_key = features[0]["key"]
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/platform/{feature_key}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Get platform feature failed: {response.text}"
            feature = response.json()
            assert feature["key"] == feature_key
            print(f"✓ Got platform feature details for: {feature.get('name')}")


class TestPaymentOptions:
    """Test Payment Options management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_payment_options(self, auth_headers):
        """Test GET /api/admin/feature-management/payments"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/payments",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get payment options failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} payment options")
        
        if len(data) > 0:
            payment = data[0]
            assert "key" in payment
            assert "name" in payment
            print(f"✓ First payment option: {payment.get('name')}")
    
    def test_get_single_payment_option(self, auth_headers):
        """Test GET /api/admin/feature-management/payments/{key}"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/payments",
            headers=auth_headers
        )
        payments = response.json()
        
        if len(payments) > 0:
            payment_key = payments[0]["key"]
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/payments/{payment_key}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Get payment option failed: {response.text}"
            payment = response.json()
            assert payment["key"] == payment_key
            print(f"✓ Got payment option details for: {payment.get('name')}")


class TestAuthOptions:
    """Test Authentication Options management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_auth_options(self, auth_headers):
        """Test GET /api/admin/feature-management/auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/auth",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get auth options failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} auth options")
        
        if len(data) > 0:
            auth_opt = data[0]
            assert "key" in auth_opt
            assert "name" in auth_opt
            print(f"✓ First auth option: {auth_opt.get('name')}")
    
    def test_get_single_auth_option(self, auth_headers):
        """Test GET /api/admin/feature-management/auth/{key}"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/auth",
            headers=auth_headers
        )
        auth_options = response.json()
        
        if len(auth_options) > 0:
            auth_key = auth_options[0]["key"]
            response = requests.get(
                f"{BASE_URL}/api/admin/feature-management/auth/{auth_key}",
                headers=auth_headers
            )
            assert response.status_code == 200, f"Get auth option failed: {response.text}"
            auth_opt = response.json()
            assert auth_opt["key"] == auth_key
            print(f"✓ Got auth option details for: {auth_opt.get('name')}")


class TestFeatureLogs:
    """Test Feature Change Logs endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_feature_logs(self, auth_headers):
        """Test GET /api/admin/feature-management/logs"""
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/logs",
            headers=auth_headers,
            params={"limit": 20}
        )
        assert response.status_code == 200, f"Get logs failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} feature change logs")


class TestBulkOperations:
    """Test bulk toggle and sync operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_bulk_toggle_features(self, auth_headers):
        """Test POST /api/admin/feature-management/bulk-toggle"""
        # Get a page key to toggle
        response = requests.get(
            f"{BASE_URL}/api/admin/feature-management/pages",
            headers=auth_headers
        )
        pages = response.json()
        
        if len(pages) > 0:
            page_key = pages[0]["key"]
            original_enabled = pages[0].get("enabled", True)
            
            # Toggle to opposite state
            response = requests.post(
                f"{BASE_URL}/api/admin/feature-management/bulk-toggle",
                headers=auth_headers,
                json={
                    "feature_type": "page",
                    "keys": [page_key],
                    "enabled": not original_enabled
                }
            )
            assert response.status_code == 200, f"Bulk toggle failed: {response.text}"
            print(f"✓ Bulk toggle successful")
            
            # Restore original state
            requests.post(
                f"{BASE_URL}/api/admin/feature-management/bulk-toggle",
                headers=auth_headers,
                json={
                    "feature_type": "page",
                    "keys": [page_key],
                    "enabled": original_enabled
                }
            )
    
    def test_sync_to_site_settings(self, auth_headers):
        """Test POST /api/admin/feature-management/sync-to-site-settings"""
        response = requests.post(
            f"{BASE_URL}/api/admin/feature-management/sync-to-site-settings",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Sync failed: {response.text}"
        print(f"✓ Sync to site settings successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
