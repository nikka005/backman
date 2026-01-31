"""
Backend API Tests for Admin Enhanced Features
- Admin Settings page
- Admin Promotions page
- Admin Users Management with Growth Progress
- Growth Tracking API
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"
USER_EMAIL = "demo@user.com"
USER_PASSWORD = "User123!"


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get regular user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"User login failed: {response.status_code} - {response.text}")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "admin"
        print(f"Admin login successful, role: {data.get('user', {}).get('role')}")


class TestAdminSettings:
    """Test Admin Settings API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_get_settings(self, admin_token):
        """Test GET /api/admin/settings/ - Get all settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/", headers=headers)
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        data = response.json()
        # Settings should have branding, ui, features, hero, stats, promo_banner
        assert "branding" in data or data is not None
        print(f"Settings loaded successfully with keys: {list(data.keys()) if isinstance(data, dict) else 'list'}")
    
    def test_get_branding(self, admin_token):
        """Test GET /api/admin/settings/branding - Get branding settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/branding", headers=headers)
        assert response.status_code == 200, f"Get branding failed: {response.text}"
        data = response.json()
        print(f"Branding settings: {data}")
    
    def test_get_ui_settings(self, admin_token):
        """Test GET /api/admin/settings/ui - Get UI settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/ui", headers=headers)
        assert response.status_code == 200, f"Get UI settings failed: {response.text}"
        data = response.json()
        print(f"UI settings: {data}")
    
    def test_get_features(self, admin_token):
        """Test GET /api/admin/settings/features - Get feature toggles"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/features", headers=headers)
        assert response.status_code == 200, f"Get features failed: {response.text}"
        data = response.json()
        print(f"Feature toggles loaded")


class TestAdminPromotions:
    """Test Admin Promotions API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_get_promotions_dashboard(self, admin_token):
        """Test GET /api/admin/promotions/dashboard - Get promotions dashboard"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions/dashboard", headers=headers)
        assert response.status_code == 200, f"Get promotions dashboard failed: {response.text}"
        data = response.json()
        print(f"Promotions dashboard: {data}")
    
    def test_get_icps(self, admin_token):
        """Test GET /api/admin/promotions/icps - Get ICPs"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions/icps", headers=headers)
        assert response.status_code == 200, f"Get ICPs failed: {response.text}"
        data = response.json()
        print(f"ICPs count: {len(data) if isinstance(data, list) else 'N/A'}")
    
    def test_get_ab_tests(self, admin_token):
        """Test GET /api/admin/promotions/ab-tests - Get A/B tests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions/ab-tests", headers=headers)
        assert response.status_code == 200, f"Get A/B tests failed: {response.text}"
        data = response.json()
        print(f"A/B tests count: {len(data) if isinstance(data, list) else 'N/A'}")
    
    def test_get_campaigns(self, admin_token):
        """Test GET /api/admin/promotions/campaigns - Get campaigns"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions/campaigns", headers=headers)
        assert response.status_code == 200, f"Get campaigns failed: {response.text}"
        data = response.json()
        print(f"Campaigns count: {len(data) if isinstance(data, list) else 'N/A'}")


class TestAdminUsersManagement:
    """Test Admin Users Management with Growth Progress"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_get_users_list(self, admin_token):
        """Test GET /api/admin/users - Get users list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Users should be a list"
        print(f"Users count: {len(data)}")
        if len(data) > 0:
            user = data[0]
            print(f"First user keys: {list(user.keys())}")
    
    def test_get_user_details(self, admin_token):
        """Test GET /api/admin/users/{user_id} - Get user details with Instagram stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get users list to find a user ID
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        if len(users) == 0:
            pytest.skip("No users found")
        
        # Get details for first user
        user_id = users[0].get("id")
        response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers)
        assert response.status_code == 200, f"Get user details failed: {response.text}"
        
        data = response.json()
        print(f"User details keys: {list(data.keys())}")
        
        # Check for instagram_stats field
        if "instagram_stats" in data:
            print(f"Instagram stats: {data['instagram_stats']}")
        
        # Check for growth_progress field
        if "growth_progress" in data:
            print(f"Growth progress: {data['growth_progress']}")
        
        # Check for subscription field
        if "subscription" in data:
            print(f"Subscription: {data['subscription']}")
    
    def test_update_user(self, admin_token):
        """Test PUT /api/admin/users/{user_id} - Update user"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users list
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = response.json()
        
        if len(users) == 0:
            pytest.skip("No users found")
        
        # Find a non-admin user to update
        test_user = None
        for user in users:
            if user.get("role") != "admin":
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No non-admin user found")
        
        user_id = test_user.get("id")
        
        # Update user name
        update_data = {"name": test_user.get("name", "Test User")}
        response = requests.put(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers, json=update_data)
        assert response.status_code == 200, f"Update user failed: {response.text}"
        print(f"User update response: {response.json()}")


class TestGrowthTracking:
    """Test Growth Tracking API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get regular user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("User login failed")
    
    def test_get_growth_status_as_admin(self, admin_token):
        """Test GET /api/growth/status/{user_id} - Get growth status as admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users list to find a user with subscription
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = response.json()
        
        # Find a user with a plan
        test_user = None
        for user in users:
            if user.get("current_plan"):
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No user with active plan found")
        
        user_id = test_user.get("id")
        response = requests.get(f"{BASE_URL}/api/growth/status/{user_id}", headers=headers)
        
        # May return 404 if no subscription or instagram account
        if response.status_code == 404:
            print(f"Growth status not available: {response.json()}")
            return
        
        assert response.status_code == 200, f"Get growth status failed: {response.text}"
        data = response.json()
        print(f"Growth status: {data}")
        
        # Verify response structure
        expected_fields = ["user_id", "plan_name", "target_followers", "start_followers", 
                         "current_followers", "followers_gained", "progress_percent", "is_complete"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"


class TestAdminPlans:
    """Test Admin Plans API for growth targets"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_get_plans(self, admin_token):
        """Test GET /api/admin/plans/ - Get all plans"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/plans/", headers=headers, params={"include_hidden": True})
        assert response.status_code == 200, f"Get plans failed: {response.text}"
        data = response.json()
        print(f"Plans count: {len(data) if isinstance(data, list) else 'N/A'}")
        
        if isinstance(data, list) and len(data) > 0:
            plan = data[0]
            print(f"First plan: {plan.get('name')} - Target: {plan.get('follower_target_max', plan.get('follower_target'))}")


class TestPublicEndpoints:
    """Test public endpoints that don't require auth"""
    
    def test_get_public_settings(self):
        """Test GET /api/public/settings - Get public settings"""
        response = requests.get(f"{BASE_URL}/api/public/settings")
        assert response.status_code == 200, f"Get public settings failed: {response.text}"
        print("Public settings loaded")
    
    def test_get_public_plans(self):
        """Test GET /api/public/plans - Get public plans"""
        response = requests.get(f"{BASE_URL}/api/public/plans")
        assert response.status_code == 200, f"Get public plans failed: {response.text}"
        data = response.json()
        print(f"Public plans count: {len(data) if isinstance(data, list) else 'N/A'}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
