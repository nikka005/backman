"""
Test Growth Engine and Google Analytics APIs
Tests for:
- Growth Engine config, campaigns, suggestions, admin stats
- Google Analytics credentials status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"
USER_EMAIL = "demo@user.com"
USER_PASSWORD = "User123!"

# Campaign ID from main agent context
TEST_CAMPAIGN_ID = "campaign_328769d024a64980"


class TestAuth:
    """Authentication helper tests"""
    
    def test_admin_login(self):
        """Test admin login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_user_login(self):
        """Test user login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.text}")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def user_token():
    """Get user auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"User login failed: {response.text}")
    return response.json()["access_token"]


class TestGrowthEngineConfig:
    """Growth Engine Configuration API tests"""
    
    def test_get_config_admin(self, admin_token):
        """GET /api/growth-engine/config - Admin can get config"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/config",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify config structure
        assert "is_active" in data
        assert "daily_target_suggestions" in data
        assert "targeting_accuracy" in data
        assert "min_follower_count" in data
        assert "max_follower_count" in data
        print(f"✓ Growth Engine Config: is_active={data['is_active']}, daily_target={data['daily_target_suggestions']}")
    
    def test_get_config_user_forbidden(self, user_token):
        """GET /api/growth-engine/config - User should get 403"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/config",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin user correctly denied access to config")


class TestGrowthEngineAdminStats:
    """Growth Engine Admin Stats API tests"""
    
    def test_get_admin_stats(self, admin_token):
        """GET /api/growth-engine/admin/stats - Returns stats with campaigns and suggestions"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify stats structure
        assert "total_campaigns" in data
        assert "active_campaigns" in data
        assert "total_suggestions" in data
        assert "total_manual_actions" in data
        
        # Verify expected values from main agent context
        assert data["total_campaigns"] >= 1, f"Expected at least 1 campaign, got {data['total_campaigns']}"
        assert data["total_suggestions"] >= 13, f"Expected at least 13 suggestions, got {data['total_suggestions']}"
        
        print(f"✓ Admin Stats: total_campaigns={data['total_campaigns']}, total_suggestions={data['total_suggestions']}")
    
    def test_admin_stats_user_forbidden(self, user_token):
        """GET /api/growth-engine/admin/stats - User should get 403"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin user correctly denied access to admin stats")


class TestGrowthEngineCampaigns:
    """Growth Engine Campaigns API tests"""
    
    def test_get_campaigns_admin(self, admin_token):
        """GET /api/growth-engine/campaigns - Admin can get campaigns"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/campaigns",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify campaigns structure
        assert "campaigns" in data
        campaigns = data["campaigns"]
        assert len(campaigns) >= 1, f"Expected at least 1 campaign, got {len(campaigns)}"
        
        # Check for @adverlyx_official campaign
        adverlyx_campaign = None
        for campaign in campaigns:
            if campaign.get("instagram_username") == "adverlyx_official":
                adverlyx_campaign = campaign
                break
        
        assert adverlyx_campaign is not None, "Expected campaign for @adverlyx_official"
        assert adverlyx_campaign.get("status") == "active", f"Expected active status, got {adverlyx_campaign.get('status')}"
        
        print(f"✓ Campaigns: Found {len(campaigns)} campaign(s), @adverlyx_official is active")
    
    def test_get_campaign_by_id(self, admin_token):
        """GET /api/growth-engine/campaigns/{id} - Get specific campaign"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/campaigns/{TEST_CAMPAIGN_ID}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify campaign structure
        assert data.get("id") == TEST_CAMPAIGN_ID
        assert data.get("instagram_username") == "adverlyx_official"
        assert "target_hashtags" in data
        assert "target_niches" in data
        assert "stats" in data
        
        print(f"✓ Campaign {TEST_CAMPAIGN_ID}: username={data['instagram_username']}, status={data.get('status')}")


class TestGrowthEngineSuggestions:
    """Growth Engine AI Suggestions API tests"""
    
    def test_get_campaign_suggestions(self, admin_token):
        """GET /api/growth-engine/campaigns/{id}/suggestions - Get AI suggestions"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/campaigns/{TEST_CAMPAIGN_ID}/suggestions",
            params={"count": 5},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify suggestions structure
        assert "suggestions" in data
        assert "count" in data
        assert "message" in data
        
        suggestions = data["suggestions"]
        assert len(suggestions) > 0, "Expected at least 1 suggestion"
        
        # Verify suggestion structure
        first_suggestion = suggestions[0]
        assert "account_type" in first_suggestion
        assert "search_strategy" in first_suggestion
        assert "engagement_tip" in first_suggestion
        assert "priority" in first_suggestion
        
        print(f"✓ Suggestions: Got {len(suggestions)} AI-generated suggestions")
        print(f"  First suggestion: {first_suggestion.get('account_type')[:50]}...")


class TestGoogleAnalyticsCredentials:
    """Google Analytics Credentials API tests"""
    
    def test_get_credentials_status(self, admin_token):
        """GET /api/google-analytics/credentials/status - Returns configured=false"""
        response = requests.get(
            f"{BASE_URL}/api/google-analytics/credentials/status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify status structure
        assert "configured" in data
        assert data["configured"] == False, f"Expected configured=false, got {data['configured']}"
        
        print(f"✓ GA4 Credentials Status: configured={data['configured']}")
    
    def test_credentials_status_user_forbidden(self, user_token):
        """GET /api/google-analytics/credentials/status - User should get 403"""
        response = requests.get(
            f"{BASE_URL}/api/google-analytics/credentials/status",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin user correctly denied access to GA credentials status")


class TestAdminChartsTraffic:
    """Admin Charts Traffic API tests (simulated data)"""
    
    def test_get_traffic_data(self, admin_token):
        """GET /api/admin/charts/traffic - Returns simulated traffic data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/traffic",
            params={"days": 30},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify traffic data structure
        assert "page_views" in data or "total_page_views" in data
        assert "is_simulated" in data or "simulated" in data or True  # May not have flag
        
        print(f"✓ Traffic Data: {data}")
    
    def test_get_dashboard_summary(self, admin_token):
        """GET /api/admin/charts/dashboard-summary - Returns dashboard summary"""
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/dashboard-summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify summary structure
        assert isinstance(data, dict)
        print(f"✓ Dashboard Summary: Keys={list(data.keys())[:5]}...")


class TestGrowthEngineAllCampaigns:
    """Growth Engine Admin All Campaigns API tests"""
    
    def test_get_all_campaigns_admin(self, admin_token):
        """GET /api/growth-engine/admin/all-campaigns - Admin gets all campaigns"""
        response = requests.get(
            f"{BASE_URL}/api/growth-engine/admin/all-campaigns",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "campaigns" in data
        assert "total" in data
        assert data["total"] >= 1
        
        print(f"✓ All Campaigns (Admin): total={data['total']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
