"""
Backend API Tests for Admin Settings and Plans Management
Tests Phase 1 (P0) - Complete Admin Global Control System
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestPublicAPIs:
    """Test public endpoints (no auth required)"""
    
    def test_public_settings(self):
        """Test GET /api/public/settings returns site settings"""
        response = requests.get(f"{BASE_URL}/api/public/settings")
        assert response.status_code == 200
        data = response.json()
        assert "branding" in data
        assert "ui" in data
        assert "features" in data
        assert "hero" in data
        
    def test_public_branding(self):
        """Test GET /api/public/branding returns branding settings"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color" in data
        
    def test_public_plans(self):
        """Test GET /api/public/plans returns pricing plans"""
        response = requests.get(f"{BASE_URL}/api/public/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least one plan should exist
        # Verify plan structure
        if len(data) > 0:
            plan = data[0]
            assert "name" in plan
            assert "slug" in plan
            assert "monthly_price" in plan
            
    def test_public_faqs(self):
        """Test GET /api/public/faqs returns FAQs"""
        response = requests.get(f"{BASE_URL}/api/public/faqs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            faq = data[0]
            assert "question" in faq
            assert "answer" in faq
            
    def test_public_hero(self):
        """Test GET /api/public/hero returns hero content"""
        response = requests.get(f"{BASE_URL}/api/public/hero")
        assert response.status_code == 200
        data = response.json()
        assert "headline_prefix" in data or "cta_text" in data
        
    def test_public_stats(self):
        """Test GET /api/public/stats returns platform stats"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert "happy_users" in data or "satisfaction_score" in data
        
    def test_public_testimonials(self):
        """Test GET /api/public/testimonials returns testimonials"""
        response = requests.get(f"{BASE_URL}/api/public/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def admin_token():
    """Get admin access token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture
def admin_headers(admin_token):
    """Get headers with admin auth token"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestAdminSettings:
    """Test admin settings endpoints"""
    
    def test_get_all_settings(self, admin_headers):
        """Test GET /api/admin/settings/ returns all settings"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "branding" in data
        assert "ui" in data
        assert "features" in data
        
    def test_get_branding(self, admin_headers):
        """Test GET /api/admin/settings/branding"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/branding", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color" in data
        
    def test_update_branding(self, admin_headers):
        """Test PUT /api/admin/settings/branding"""
        # First get current branding
        get_response = requests.get(f"{BASE_URL}/api/admin/settings/branding", headers=admin_headers)
        original_branding = get_response.json()
        
        # Update branding
        updated_branding = original_branding.copy()
        updated_branding["tagline"] = "TEST_Updated Tagline"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/branding",
            headers=admin_headers,
            json=updated_branding
        )
        assert response.status_code == 200
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/admin/settings/branding", headers=admin_headers)
        assert verify_response.json()["tagline"] == "TEST_Updated Tagline"
        
        # Restore original
        original_branding["tagline"] = "Smart Growth for Real Brands"
        requests.put(f"{BASE_URL}/api/admin/settings/branding", headers=admin_headers, json=original_branding)
        
    def test_get_ui_settings(self, admin_headers):
        """Test GET /api/admin/settings/ui"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/ui", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "animations_enabled" in data or "default_theme" in data
        
    def test_update_ui_settings(self, admin_headers):
        """Test PUT /api/admin/settings/ui"""
        # Get current UI settings
        get_response = requests.get(f"{BASE_URL}/api/admin/settings/ui", headers=admin_headers)
        ui_settings = get_response.json()
        
        # Update
        ui_settings["animations_enabled"] = True
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/ui",
            headers=admin_headers,
            json=ui_settings
        )
        assert response.status_code == 200
        
    def test_get_feature_toggles(self, admin_headers):
        """Test GET /api/admin/settings/features"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/features", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have feature toggle fields
        assert isinstance(data, dict)
        
    def test_update_feature_toggles(self, admin_headers):
        """Test PUT /api/admin/settings/features"""
        get_response = requests.get(f"{BASE_URL}/api/admin/settings/features", headers=admin_headers)
        features = get_response.json()
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/features",
            headers=admin_headers,
            json=features
        )
        assert response.status_code == 200
        
    def test_get_hero_content(self, admin_headers):
        """Test GET /api/admin/settings/hero"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/hero", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "headline_prefix" in data or "cta_text" in data
        
    def test_update_hero_content(self, admin_headers):
        """Test PUT /api/admin/settings/hero"""
        get_response = requests.get(f"{BASE_URL}/api/admin/settings/hero", headers=admin_headers)
        hero = get_response.json()
        
        hero["cta_text"] = "TEST_Start Growing Now"
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/hero",
            headers=admin_headers,
            json=hero
        )
        assert response.status_code == 200
        
        # Restore
        hero["cta_text"] = "Start Growing"
        requests.put(f"{BASE_URL}/api/admin/settings/hero", headers=admin_headers, json=hero)
        
    def test_get_promo_banner(self, admin_headers):
        """Test GET /api/admin/settings/promo-banner"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/promo-banner", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data or "message" in data
        
    def test_update_promo_banner(self, admin_headers):
        """Test PUT /api/admin/settings/promo-banner"""
        get_response = requests.get(f"{BASE_URL}/api/admin/settings/promo-banner", headers=admin_headers)
        banner = get_response.json()
        
        banner["message"] = "TEST_Promo Message"
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/promo-banner",
            headers=admin_headers,
            json=banner
        )
        assert response.status_code == 200
        
        # Restore
        banner["message"] = '🎉 <strong>50% OFF</strong> Annual Plans | Flash Sale Ends Soon!'
        requests.put(f"{BASE_URL}/api/admin/settings/promo-banner", headers=admin_headers, json=banner)


class TestAdminPlans:
    """Test admin plans management endpoints"""
    
    def test_get_all_plans(self, admin_headers):
        """Test GET /api/admin/plans/ returns all plans"""
        response = requests.get(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers,
            params={"include_hidden": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least default plans should exist
        
    def test_get_plan_by_id(self, admin_headers):
        """Test GET /api/admin/plans/{plan_id}"""
        # First get all plans
        plans_response = requests.get(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers
        )
        plans = plans_response.json()
        
        if len(plans) > 0:
            plan_id = plans[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/admin/plans/{plan_id}",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == plan_id
            
    def test_create_plan(self, admin_headers):
        """Test POST /api/admin/plans/ creates a new plan"""
        unique_slug = f"test-plan-{uuid.uuid4().hex[:8]}"
        new_plan = {
            "name": "TEST_New Plan",
            "slug": unique_slug,
            "description": "Test plan description",
            "monthly_price": 99.0,
            "yearly_price": 79.0,
            "followers_min": 2000,
            "followers_max": 5000,
            "feature_list": ["Feature 1", "Feature 2"],
            "is_active": True,
            "is_hidden": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers,
            json=new_plan
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        
        # Verify plan was created
        plan_id = data["id"]
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/plans/{plan_id}",
            headers=admin_headers
        )
        assert verify_response.status_code == 200
        assert verify_response.json()["name"] == "TEST_New Plan"
        
        # Cleanup - delete the test plan
        requests.delete(f"{BASE_URL}/api/admin/plans/{plan_id}", headers=admin_headers)
        
    def test_update_plan(self, admin_headers):
        """Test PUT /api/admin/plans/{plan_id} updates a plan"""
        # Create a test plan first
        unique_slug = f"test-update-{uuid.uuid4().hex[:8]}"
        new_plan = {
            "name": "TEST_Update Plan",
            "slug": unique_slug,
            "description": "Original description",
            "monthly_price": 50.0,
            "yearly_price": 40.0,
            "followers_min": 1000,
            "followers_max": 2000,
            "feature_list": ["Feature 1"],
            "is_active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers,
            json=new_plan
        )
        plan_id = create_response.json()["id"]
        
        # Update the plan
        update_data = {
            "name": "TEST_Updated Plan Name",
            "description": "Updated description",
            "monthly_price": 75.0
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/plans/{plan_id}",
            headers=admin_headers,
            json=update_data
        )
        assert update_response.status_code == 200
        
        # Verify update persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/plans/{plan_id}",
            headers=admin_headers
        )
        assert verify_response.json()["name"] == "TEST_Updated Plan Name"
        assert verify_response.json()["monthly_price"] == 75.0
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/plans/{plan_id}", headers=admin_headers)
        
    def test_toggle_popular_plan(self, admin_headers):
        """Test POST /api/admin/plans/{plan_id}/toggle-popular"""
        # Get existing plans
        plans_response = requests.get(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers
        )
        plans = plans_response.json()
        
        if len(plans) > 0:
            plan_id = plans[0]["id"]
            response = requests.post(
                f"{BASE_URL}/api/admin/plans/{plan_id}/toggle-popular",
                headers=admin_headers
            )
            assert response.status_code == 200
            
    def test_delete_plan(self, admin_headers):
        """Test DELETE /api/admin/plans/{plan_id}"""
        # Create a test plan to delete
        unique_slug = f"test-delete-{uuid.uuid4().hex[:8]}"
        new_plan = {
            "name": "TEST_Delete Plan",
            "slug": unique_slug,
            "description": "Plan to be deleted",
            "monthly_price": 30.0,
            "yearly_price": 25.0,
            "followers_min": 500,
            "followers_max": 1000,
            "feature_list": [],
            "is_active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/plans/",
            headers=admin_headers,
            json=new_plan
        )
        plan_id = create_response.json()["id"]
        
        # Delete the plan
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/plans/{plan_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/plans/{plan_id}",
            headers=admin_headers
        )
        assert verify_response.status_code == 404


class TestUnauthorizedAccess:
    """Test that admin endpoints require authentication"""
    
    def test_settings_requires_auth(self):
        """Test admin settings endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        
    def test_plans_requires_auth(self):
        """Test admin plans endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/plans/")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
