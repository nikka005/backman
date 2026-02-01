"""
Test suite for new admin features:
1. Subscription Renewals
2. Refund Management
3. Invoices
4. i18n (Multi-language)
5. Admin Charts
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


class TestAuth:
    """Authentication helpers"""
    
    @staticmethod
    def get_admin_token():
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    @staticmethod
    def get_user_token():
        """Get regular user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None


# ============== Subscription Renewals Tests ==============

class TestSubscriptionRenewals:
    """Test subscription renewal endpoints"""
    
    def test_get_renewal_settings_admin(self):
        """Test GET /api/subscription-renewals/settings - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/subscription-renewals/settings",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify settings structure
        assert "auto_renewal_enabled" in data
        assert "max_retry_attempts" in data
        assert "grace_period_days" in data
        print(f"✓ Renewal settings: auto_renewal={data.get('auto_renewal_enabled')}, grace_period={data.get('grace_period_days')} days")
    
    def test_get_renewal_settings_forbidden_for_user(self):
        """Test GET /api/subscription-renewals/settings - User access denied"""
        token = TestAuth.get_user_token()
        assert token is not None, "User login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/subscription-renewals/settings",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Renewal settings correctly denied for non-admin user")
    
    def test_get_upcoming_renewals(self):
        """Test GET /api/subscription-renewals/upcoming-renewals - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/subscription-renewals/upcoming-renewals?days=7",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total_upcoming" in data
        assert "subscriptions" in data
        print(f"✓ Upcoming renewals (7 days): {data.get('total_upcoming')} subscriptions")
    
    def test_get_due_renewals(self):
        """Test GET /api/subscription-renewals/due - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/subscription-renewals/due",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "due_count" in data
        assert "subscriptions" in data
        print(f"✓ Due renewals: {data.get('due_count')} subscriptions")
    
    def test_get_renewal_history(self):
        """Test GET /api/subscription-renewals/history - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/subscription-renewals/history?limit=20",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "renewals" in data
        print(f"✓ Renewal history: {len(data.get('renewals', []))} records")


# ============== Refund Management Tests ==============

class TestRefundManagement:
    """Test refund management endpoints"""
    
    def test_get_refunds_list_admin(self):
        """Test GET /api/refunds/ - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/refunds/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "refunds" in data
        assert "total" in data
        assert "stats" in data
        
        stats = data.get("stats", {})
        print(f"✓ Refunds list: {data.get('total')} total, {stats.get('pending', 0)} pending")
    
    def test_get_refund_stats_admin(self):
        """Test GET /api/refunds/stats/summary - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/refunds/stats/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify stats structure
        assert "total_refunds" in data
        assert "pending_refunds" in data
        assert "refund_rate" in data
        
        print(f"✓ Refund stats: {data.get('total_refunds')} total, {data.get('refund_rate')}% rate")
    
    def test_get_refund_stats_forbidden_for_user(self):
        """Test GET /api/refunds/stats/summary - User access denied"""
        token = TestAuth.get_user_token()
        assert token is not None, "User login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/refunds/stats/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Refund stats correctly denied for non-admin user")


# ============== Invoices Tests ==============

class TestInvoices:
    """Test invoice endpoints"""
    
    def test_get_my_invoices_user(self):
        """Test GET /api/invoices/my-invoices - User access"""
        token = TestAuth.get_user_token()
        assert token is not None, "User login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/invoices/my-invoices",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "invoices" in data
        print(f"✓ User invoices: {len(data.get('invoices', []))} invoices")
    
    def test_get_all_invoices_admin(self):
        """Test GET /api/invoices/admin/all - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/invoices/admin/all",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "invoices" in data
        assert "total" in data
        print(f"✓ All invoices (admin): {data.get('total')} total")
    
    def test_get_all_invoices_forbidden_for_user(self):
        """Test GET /api/invoices/admin/all - User access denied"""
        token = TestAuth.get_user_token()
        assert token is not None, "User login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/invoices/admin/all",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Admin invoices correctly denied for non-admin user")


# ============== i18n (Multi-language) Tests ==============

class TestI18n:
    """Test internationalization endpoints"""
    
    def test_get_supported_languages(self):
        """Test GET /api/i18n/languages - Public access"""
        response = requests.get(f"{BASE_URL}/api/i18n/languages")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "languages" in data
        assert "default" in data
        
        languages = data.get("languages", {})
        assert "en" in languages
        assert "es" in languages
        print(f"✓ Supported languages: {len(languages)} languages, default={data.get('default')}")
    
    def test_get_spanish_translations(self):
        """Test GET /api/i18n/translations/es - Spanish translations"""
        response = requests.get(f"{BASE_URL}/api/i18n/translations/es")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "language" in data
        assert data.get("language") == "es"
        assert "translations" in data
        assert "language_info" in data
        
        translations = data.get("translations", {})
        assert "nav.home" in translations
        print(f"✓ Spanish translations: {len(translations)} keys, nav.home='{translations.get('nav.home')}'")
    
    def test_get_english_translations(self):
        """Test GET /api/i18n/translations/en - English translations"""
        response = requests.get(f"{BASE_URL}/api/i18n/translations/en")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("language") == "en"
        translations = data.get("translations", {})
        assert "nav.home" in translations
        assert translations.get("nav.home") == "Home"
        print(f"✓ English translations: {len(translations)} keys")
    
    def test_get_unsupported_language(self):
        """Test GET /api/i18n/translations/xx - Unsupported language"""
        response = requests.get(f"{BASE_URL}/api/i18n/translations/xx")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unsupported language correctly returns 404")
    
    def test_get_language_settings(self):
        """Test GET /api/i18n/settings - Public access"""
        response = requests.get(f"{BASE_URL}/api/i18n/settings")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "default_language" in data
        assert "enabled_languages" in data
        assert "auto_detect" in data
        print(f"✓ Language settings: default={data.get('default_language')}, enabled={data.get('enabled_languages')}")


# ============== Admin Charts Tests ==============

class TestAdminCharts:
    """Test admin charts and analytics endpoints"""
    
    def test_get_revenue_chart(self):
        """Test GET /api/admin/charts/revenue - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/revenue?days=30",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "chart_data" in data
        assert "summary" in data
        
        summary = data.get("summary", {})
        print(f"✓ Revenue chart: ${summary.get('total', 0)} total, {summary.get('growth_percent', 0)}% growth")
    
    def test_get_users_chart(self):
        """Test GET /api/admin/charts/users - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/users?days=30",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "chart_data" in data
        assert "summary" in data
        
        summary = data.get("summary", {})
        print(f"✓ Users chart: {summary.get('total_users', 0)} total, +{summary.get('new_users_period', 0)} this period")
    
    def test_get_traffic_chart(self):
        """Test GET /api/admin/charts/traffic - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/traffic?days=30",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "chart_data" in data
        assert "summary" in data
        
        summary = data.get("summary", {})
        print(f"✓ Traffic chart: {summary.get('total_page_views', 0)} views, {summary.get('average_bounce_rate', 0)}% bounce")
    
    def test_get_traffic_sources(self):
        """Test GET /api/admin/charts/traffic-sources - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/traffic-sources",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "sources" in data
        sources = data.get("sources", {})
        print(f"✓ Traffic sources: {len(sources)} sources")
    
    def test_get_conversion_funnel(self):
        """Test GET /api/admin/charts/conversion-funnel - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/conversion-funnel?days=30",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "funnel" in data
        assert "conversion_rates" in data
        
        rates = data.get("conversion_rates", {})
        print(f"✓ Conversion funnel: {rates.get('overall', 0)}% overall conversion")
    
    def test_get_realtime_stats(self):
        """Test GET /api/admin/charts/realtime - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/realtime",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "active_users" in data
        assert "current_visitors" in data
        assert "recent_signups" in data
        print(f"✓ Realtime stats: {data.get('active_users', 0)} active, {data.get('current_visitors', 0)} visitors")
    
    def test_get_dashboard_summary(self):
        """Test GET /api/admin/charts/dashboard-summary - Admin access"""
        token = TestAuth.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/charts/dashboard-summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "summary" in data
        assert "revenue_chart" in data
        assert "users_chart" in data
        assert "traffic_chart" in data
        
        summary = data.get("summary", {})
        print(f"✓ Dashboard summary: {summary.get('total_users', 0)} users, ${summary.get('mrr', 0)} MRR")
    
    def test_charts_forbidden_for_user(self):
        """Test admin charts endpoints - User access denied"""
        token = TestAuth.get_user_token()
        assert token is not None, "User login failed"
        
        endpoints = [
            "/api/admin/charts/revenue",
            "/api/admin/charts/users",
            "/api/admin/charts/traffic",
            "/api/admin/charts/realtime"
        ]
        
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 403, f"Expected 403 for {endpoint}, got {response.status_code}"
        
        print("✓ All admin chart endpoints correctly denied for non-admin user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
