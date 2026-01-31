"""
Test suite for new Adverlyx Digital features:
- AI Analytics Dashboard
- Notification Preferences
- Scheduler (Admin only)
- Instagram Insights
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEMO_USER_EMAIL = "demo@user.com"
DEMO_USER_PASSWORD = "User123!"
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestAuth:
    """Authentication helper tests"""
    
    @pytest.fixture(scope="class")
    def demo_user_token(self):
        """Get demo user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Demo user login failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code}")
    
    def test_demo_user_login(self):
        """Test demo user can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data


class TestAIAnalyticsDashboard:
    """AI Analytics Dashboard API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Login failed")
    
    def test_ai_analytics_dashboard_returns_200(self, auth_headers):
        """GET /api/ai-analytics/dashboard returns 200 with performance scores"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "performance_scores" in data
        assert "growth_analysis" in data
        assert "content_recommendations" in data
        
        # Verify performance scores structure
        scores = data["performance_scores"]
        assert "overall_score" in scores
        assert "engagement_score" in scores
        assert "growth_score" in scores
        assert "content_score" in scores
        assert "consistency_score" in scores
    
    def test_ai_analytics_insights_returns_200(self, auth_headers):
        """GET /api/ai-analytics/insights returns growth insights"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/insights", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "insights" in data
        assert "growth_trend" in data
        assert "avg_daily_growth" in data
        
        # Insights should be a list
        assert isinstance(data["insights"], list)
    
    def test_ai_analytics_recommendations_returns_200(self, auth_headers):
        """GET /api/ai-analytics/recommendations returns content recommendations"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/recommendations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        
        # If recommendations exist, verify structure
        if data["recommendations"]:
            rec = data["recommendations"][0]
            assert "type" in rec
            assert "topic" in rec
            assert "best_time" in rec
    
    def test_ai_analytics_performance_returns_200(self, auth_headers):
        """GET /api/ai-analytics/performance returns performance scores"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/performance", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all score fields
        assert "overall_score" in data
        assert "engagement_score" in data
        assert "growth_score" in data
        assert "content_score" in data
        assert "consistency_score" in data
    
    def test_ai_analytics_weekly_summary_returns_200(self, auth_headers):
        """GET /api/ai-analytics/weekly-summary returns weekly summary"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/weekly-summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "followers_gained" in data
        assert "avg_daily_growth" in data
        assert "current_followers" in data
    
    def test_ai_analytics_requires_auth(self):
        """AI Analytics endpoints require authentication"""
        endpoints = [
            "/api/ai-analytics/dashboard",
            "/api/ai-analytics/insights",
            "/api/ai-analytics/recommendations",
            "/api/ai-analytics/performance",
            "/api/ai-analytics/weekly-summary"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code in [401, 403], f"{endpoint} should require auth"


class TestNotificationPreferences:
    """Notification Preferences API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Login failed")
    
    def test_get_notification_preferences_returns_200(self, auth_headers):
        """GET /api/notification-preferences returns user preferences"""
        response = requests.get(f"{BASE_URL}/api/notification-preferences", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all preference fields exist
        expected_fields = [
            "email_notifications",
            "growth_milestone_alerts",
            "weekly_reports",
            "promotional_emails",
            "security_alerts",
            "billing_alerts",
            "new_features",
            "tips_and_tricks"
        ]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], bool), f"{field} should be boolean"
    
    def test_update_notification_preferences_returns_200(self, auth_headers):
        """PUT /api/notification-preferences updates preferences"""
        # First get current preferences
        get_response = requests.get(f"{BASE_URL}/api/notification-preferences", headers=auth_headers)
        original_prefs = get_response.json()
        
        # Update a preference
        new_value = not original_prefs.get("promotional_emails", False)
        update_response = requests.put(
            f"{BASE_URL}/api/notification-preferences",
            headers=auth_headers,
            json={"promotional_emails": new_value}
        )
        assert update_response.status_code == 200
        updated_data = update_response.json()
        
        # Verify the update was applied
        assert updated_data["promotional_emails"] == new_value
        
        # Restore original value
        requests.put(
            f"{BASE_URL}/api/notification-preferences",
            headers=auth_headers,
            json={"promotional_emails": original_prefs.get("promotional_emails", False)}
        )
    
    def test_update_multiple_preferences(self, auth_headers):
        """PUT /api/notification-preferences can update multiple preferences"""
        response = requests.put(
            f"{BASE_URL}/api/notification-preferences",
            headers=auth_headers,
            json={
                "weekly_reports": True,
                "new_features": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["weekly_reports"] == True
        assert data["new_features"] == True
    
    def test_reset_notification_preferences(self, auth_headers):
        """POST /api/notification-preferences/reset resets to defaults"""
        response = requests.post(
            f"{BASE_URL}/api/notification-preferences/reset",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify defaults are applied
        assert data["email_notifications"] == True
        assert data["security_alerts"] == True
        assert data["promotional_emails"] == False
    
    def test_notification_preferences_requires_auth(self):
        """Notification preferences endpoints require authentication"""
        # GET
        response = requests.get(f"{BASE_URL}/api/notification-preferences")
        assert response.status_code in [401, 403]
        
        # PUT
        response = requests.put(
            f"{BASE_URL}/api/notification-preferences",
            json={"email_notifications": True}
        )
        assert response.status_code in [401, 403]


class TestSchedulerAdmin:
    """Scheduler API tests (Admin only)"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get auth headers for admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Admin login failed")
    
    @pytest.fixture(scope="class")
    def demo_user_headers(self):
        """Get auth headers for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Demo user login failed")
    
    def test_scheduler_status_returns_200_for_admin(self, admin_headers):
        """GET /api/scheduler/status returns scheduler config for admin"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "scheduler_running" in data
        assert "config" in data
        
        # Verify config structure
        config = data["config"]
        assert "weekly_report_enabled" in config
        assert "weekly_report_day" in config
        assert "weekly_report_hour" in config
    
    def test_scheduler_status_forbidden_for_regular_user(self, demo_user_headers):
        """GET /api/scheduler/status returns 403 for non-admin users"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status", headers=demo_user_headers)
        assert response.status_code == 403
    
    def test_scheduler_status_requires_auth(self):
        """GET /api/scheduler/status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code in [401, 403]
    
    def test_scheduler_config_update_for_admin(self, admin_headers):
        """PUT /api/scheduler/config updates scheduler configuration"""
        response = requests.put(
            f"{BASE_URL}/api/scheduler/config",
            headers=admin_headers,
            json={"weekly_report_enabled": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestInstagramInsights:
    """Instagram Insights API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Login failed")
    
    def test_instagram_insights_returns_200(self, auth_headers):
        """GET /api/instagram-api/insights returns detailed metrics"""
        response = requests.get(f"{BASE_URL}/api/instagram-api/insights", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response has expected fields
        expected_fields = ["reach", "impressions", "profile_views", "website_clicks"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_instagram_analytics_summary_returns_200(self, auth_headers):
        """GET /api/instagram-api/analytics/summary returns analytics summary"""
        response = requests.get(f"{BASE_URL}/api/instagram-api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should return some analytics data
        assert isinstance(data, dict)
    
    def test_instagram_account_returns_200(self, auth_headers):
        """GET /api/instagram/account returns account info"""
        response = requests.get(f"{BASE_URL}/api/instagram/account", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify account data structure
        assert "username" in data or "id" in data
    
    def test_instagram_insights_requires_auth(self):
        """Instagram insights require authentication"""
        response = requests.get(f"{BASE_URL}/api/instagram-api/insights")
        assert response.status_code in [401, 403]


class TestIntegration:
    """Integration tests for new features"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Login failed")
    
    def test_dashboard_data_flow(self, auth_headers):
        """Test that dashboard can fetch all required data"""
        # Fetch all dashboard-related endpoints
        endpoints = [
            "/api/instagram/account",
            "/api/instagram/stats",
            "/api/ai-analytics/dashboard",
            "/api/notification-preferences",
            "/api/instagram-api/insights"
        ]
        
        results = {}
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=auth_headers)
            results[endpoint] = response.status_code
        
        # All should return 200
        for endpoint, status in results.items():
            assert status == 200, f"{endpoint} returned {status}"
    
    def test_notification_preferences_persist(self, auth_headers):
        """Test that notification preference changes persist"""
        # Get current preferences
        get_response = requests.get(f"{BASE_URL}/api/notification-preferences", headers=auth_headers)
        original = get_response.json()
        
        # Update a preference
        new_value = not original.get("tips_and_tricks", True)
        requests.put(
            f"{BASE_URL}/api/notification-preferences",
            headers=auth_headers,
            json={"tips_and_tricks": new_value}
        )
        
        # Verify it persisted
        verify_response = requests.get(f"{BASE_URL}/api/notification-preferences", headers=auth_headers)
        assert verify_response.json()["tips_and_tricks"] == new_value
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/notification-preferences",
            headers=auth_headers,
            json={"tips_and_tricks": original.get("tips_and_tricks", True)}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
