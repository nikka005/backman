"""
Test suite for Admin Dashboard refactoring and Weekly Reports feature
Tests: AdminUsersManagement, AdminSubscriptionsManagement, AdminPaymentsManagement, 
       AdminTicketsManagement, AdminWeeklyReports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Admin login failed: {response.status_code}")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") in ["admin", "manager"]


class TestAdminDashboard:
    """Test admin dashboard endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_dashboard(self, admin_token):
        """Test GET /api/admin/dashboard returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Verify dashboard stats structure
        assert "total_users" in data
        assert "active_subscriptions" in data
        assert "mrr" in data
        assert "open_tickets" in data


class TestAdminUsersManagement:
    """Test admin users management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_users_list(self, admin_token):
        """Test GET /api/admin/users returns user list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=50",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify user structure if users exist
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "name" in user
            assert "status" in user
    
    def test_get_users_with_search(self, admin_token):
        """Test GET /api/admin/users with search parameter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=50&search=admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_single_user(self, admin_token):
        """Test GET /api/admin/users/:id returns user details"""
        # First get list of users
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=1",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if list_response.status_code == 200 and len(list_response.json()) > 0:
            user_id = list_response.json()[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/admin/users/{user_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == user_id


class TestAdminSubscriptionsManagement:
    """Test admin subscriptions management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_subscriptions_list(self, admin_token):
        """Test GET /api/admin/subscriptions returns subscription list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify subscription structure if subscriptions exist
        if len(data) > 0:
            sub = data[0]
            assert "id" in sub
            assert "plan" in sub
            assert "status" in sub


class TestAdminPaymentsManagement:
    """Test admin payments management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_payments_list(self, admin_token):
        """Test GET /api/admin/payments returns payment list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/payments",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify payment structure if payments exist
        if len(data) > 0:
            payment = data[0]
            assert "id" in payment
            assert "amount" in payment
            assert "status" in payment


class TestAdminTicketsManagement:
    """Test admin tickets management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_tickets_list(self, admin_token):
        """Test GET /api/admin/tickets returns ticket list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/tickets",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify ticket structure if tickets exist
        if len(data) > 0:
            ticket = data[0]
            assert "id" in ticket
            assert "subject" in ticket
            assert "status" in ticket


class TestWeeklyReportsAPI:
    """Test Weekly Reports API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_weekly_reports_history(self, admin_token):
        """Test GET /api/weekly-reports/history returns array"""
        response = requests.get(
            f"{BASE_URL}/api/weekly-reports/history",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_weekly_reports_history_requires_auth(self):
        """Test /api/weekly-reports/history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/weekly-reports/history")
        assert response.status_code in [401, 403]
    
    def test_weekly_reports_preview_requires_auth(self):
        """Test /api/weekly-reports/preview requires authentication"""
        response = requests.get(f"{BASE_URL}/api/weekly-reports/preview/test-user-id")
        assert response.status_code in [401, 403]
    
    def test_weekly_reports_send_requires_auth(self):
        """Test POST /api/weekly-reports/send requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/weekly-reports/send",
            json={"user_id": None}
        )
        assert response.status_code in [401, 403]
    
    def test_preview_report_for_user(self, admin_token):
        """Test GET /api/weekly-reports/preview/:user_id"""
        # First get a user with Instagram account
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=100",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if users_response.status_code == 200:
            users = users_response.json()
            # Find user with Instagram
            user_with_ig = next((u for u in users if u.get("instagram_username")), None)
            if user_with_ig:
                response = requests.get(
                    f"{BASE_URL}/api/weekly-reports/preview/{user_with_ig['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert "data" in data
                assert "html_preview" in data
            else:
                pytest.skip("No users with Instagram accounts found")


class TestAdminPlans:
    """Test admin plans endpoint for subscriptions management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_plans_list(self, admin_token):
        """Test GET /api/admin/plans returns plans list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/plans?include_inactive=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAuthenticationRequired:
    """Test that all admin endpoints require authentication"""
    
    def test_dashboard_requires_auth(self):
        """Test /api/admin/dashboard requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code in [401, 403]
    
    def test_users_requires_auth(self):
        """Test /api/admin/users requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403]
    
    def test_subscriptions_requires_auth(self):
        """Test /api/admin/subscriptions requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/subscriptions")
        assert response.status_code in [401, 403]
    
    def test_payments_requires_auth(self):
        """Test /api/admin/payments requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code in [401, 403]
    
    def test_tickets_requires_auth(self):
        """Test /api/admin/tickets requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code in [401, 403]
