"""
Test follower analytics and growth data endpoints
Tests the fix for user Analytics page and Dashboard showing real follower gain data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFollowerAnalytics:
    """Test follower growth analytics endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.user_email = "demo@user.com"
        self.user_password = "User123!"
        self.admin_email = "admin@adverlyx.com"
        self.admin_password = "Admin123!"
    
    def get_user_token(self):
        """Get authentication token for demo user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.user_email, "password": self.user_password}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_admin_token(self):
        """Get authentication token for admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.admin_email, "password": self.admin_password}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    # ============== Analytics Summary Tests ==============
    
    def test_analytics_summary_returns_follower_growth_data(self):
        """Test that analytics/summary endpoint returns follower growth metrics"""
        token = self.get_user_token()
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/analytics/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields exist
        assert "followers_today" in data, "Missing followers_today field"
        assert "followers_this_week" in data, "Missing followers_this_week field"
        assert "followers_this_month" in data, "Missing followers_this_month field"
        assert "total_followers_gained" in data, "Missing total_followers_gained field"
        assert "current_followers" in data, "Missing current_followers field"
        assert "engagement_rate" in data, "Missing engagement_rate field"
        
        # Verify data types
        assert isinstance(data["followers_today"], (int, float)), "followers_today should be numeric"
        assert isinstance(data["followers_this_week"], (int, float)), "followers_this_week should be numeric"
        assert isinstance(data["followers_this_month"], (int, float)), "followers_this_month should be numeric"
        
        print(f"Analytics Summary: followers_today={data['followers_today']}, "
              f"followers_this_week={data['followers_this_week']}, "
              f"followers_this_month={data['followers_this_month']}")
    
    def test_analytics_summary_has_non_zero_growth_for_demo_user(self):
        """Test that demo user has non-zero follower growth data (seeded data)"""
        token = self.get_user_token()
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/analytics/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Demo user should have seeded growth data
        # According to main agent: @testuser_demo has +8 today, +14 week, +56 month
        assert data["followers_today"] == 8, f"Expected followers_today=8, got {data['followers_today']}"
        assert data["followers_this_week"] == 14, f"Expected followers_this_week=14, got {data['followers_this_week']}"
        assert data["followers_this_month"] == 56, f"Expected followers_this_month=56, got {data['followers_this_month']}"
        
        print(f"SUCCESS: Demo user has correct seeded growth data")
    
    def test_analytics_summary_includes_targeting_quality(self):
        """Test that analytics summary includes targeting quality score"""
        token = self.get_user_token()
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/analytics/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "targeting_quality" in data, "Missing targeting_quality field"
        assert isinstance(data["targeting_quality"], (int, float)), "targeting_quality should be numeric"
        assert 0 <= data["targeting_quality"] <= 100, "targeting_quality should be 0-100"
        
        print(f"Targeting quality: {data['targeting_quality']}")
    
    # ============== Account Stats Tests ==============
    
    def test_account_stats_endpoint(self):
        """Test that account-stats endpoint returns correct data"""
        token = self.get_user_token()
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/account-stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "username" in data, "Missing username field"
        assert "followers_count" in data, "Missing followers_count field"
        assert "following_count" in data, "Missing following_count field"
        assert "posts_count" in data, "Missing posts_count field"
        assert "engagement_rate" in data, "Missing engagement_rate field"
        
        print(f"Account stats: @{data['username']} - {data['followers_count']} followers")
    
    # ============== Insights Tests ==============
    
    def test_insights_endpoint(self):
        """Test that insights endpoint returns analytics data"""
        token = self.get_user_token()
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/insights",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "username" in data, "Missing username field"
        assert "followers_count" in data, "Missing followers_count field"
        assert "engagement_rate" in data, "Missing engagement_rate field"
        assert "reach" in data, "Missing reach field"
        assert "impressions" in data, "Missing impressions field"
        assert "profile_views" in data, "Missing profile_views field"
        
        print(f"Insights: reach={data['reach']}, impressions={data['impressions']}, profile_views={data['profile_views']}")
    
    # ============== OAuth Status Tests ==============
    
    def test_oauth_status_endpoint(self):
        """Test OAuth status endpoint"""
        # Get fresh token
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@user.com", "password": "User123!"}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        token = response.json().get("access_token")
        assert token is not None, "Failed to get user token"
        
        response = requests.get(
            f"{BASE_URL}/api/instagram-api/oauth/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        assert "connected" in data, "Missing connected field"
        assert "oauth_connected" in data, "Missing oauth_connected field"
        
        print(f"OAuth status: connected={data['connected']}, oauth_connected={data['oauth_connected']}")
    
    # ============== Unauthorized Access Tests ==============
    
    def test_analytics_summary_requires_auth(self):
        """Test that analytics/summary requires authentication"""
        response = requests.get(f"{BASE_URL}/api/instagram-api/analytics/summary")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_account_stats_requires_auth(self):
        """Test that account-stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/instagram-api/account-stats")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestAdminDashboard:
    """Test admin dashboard API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.admin_email = "admin@adverlyx.com"
        self.admin_password = "Admin123!"
    
    def get_admin_token(self):
        """Get authentication token for admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.admin_email, "password": self.admin_password}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_admin_dashboard_endpoint(self):
        """Test admin dashboard returns stats"""
        # Get fresh token
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@adverlyx.com", "password": "Admin123!"}
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"
        token = response.json().get("access_token")
        assert token is not None, "Failed to get admin token"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "total_users" in data, "Missing total_users field"
        assert "active_subscriptions" in data, "Missing active_subscriptions field"
        assert "mrr" in data, "Missing mrr field"
        assert "open_tickets" in data, "Missing open_tickets field"
        
        print(f"Admin dashboard: {data['total_users']} users, {data['active_subscriptions']} subscriptions, ${data['mrr']} MRR")
    
    def test_admin_dashboard_requires_admin_role(self):
        """Test that admin dashboard requires admin role"""
        # Login as regular user
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@user.com", "password": "User123!"}
        )
        
        if response.status_code == 200:
            user_token = response.json().get("access_token")
            
            # Try to access admin dashboard
            response = requests.get(
                f"{BASE_URL}/api/admin/dashboard",
                headers={"Authorization": f"Bearer {user_token}"}
            )
            
            # Should return 403 for non-admin
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
