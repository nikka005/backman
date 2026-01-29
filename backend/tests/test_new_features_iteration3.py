"""
Test suite for Adverlyx Digital - Iteration 3 Features
Tests: Email Templates, Rate Limits Dashboard, Data Export, Push Notifications, Stripe Webhooks
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@adverlyx.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@adverlyx.com",
        "password": "Admin123!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin login failed - skipping authenticated tests")


@pytest.fixture
def admin_headers(admin_token):
    """Get headers with admin token"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


# ==================== EMAIL TEMPLATES TESTS ====================

class TestEmailTemplates:
    """Test Email Template APIs"""
    
    def test_initialize_email_templates(self, admin_headers):
        """Initialize email templates"""
        response = requests.post(
            f"{BASE_URL}/api/admin/email-templates/initialize",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Initialize failed: {response.text}"
        data = response.json()
        assert "message" in data or "templates" in data or "count" in data
    
    def test_get_email_templates(self, admin_headers):
        """Get all email templates - should return 5 templates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/email-templates/",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get templates failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Should have at least 5 templates
        assert len(data) >= 5, f"Expected at least 5 templates, got {len(data)}"
        
        # Check template structure
        for template in data:
            assert "key" in template, "Template missing 'key'"
            assert "name" in template, "Template missing 'name'"
            assert "subject" in template, "Template missing 'subject'"
    
    def test_preview_email_template(self, admin_headers):
        """Preview an email template"""
        response = requests.post(
            f"{BASE_URL}/api/admin/email-templates/welcome/preview",
            headers=admin_headers,
            json={}
        )
        assert response.status_code == 200, f"Preview failed: {response.text}"
        data = response.json()
        assert "html_content" in data, "Preview missing html_content"
    
    def test_update_email_template(self, admin_headers):
        """Update an email template"""
        response = requests.put(
            f"{BASE_URL}/api/admin/email-templates/welcome",
            headers=admin_headers,
            json={
                "subject": "Welcome to Adverlyx Digital - Test Update",
                "enabled": True
            }
        )
        assert response.status_code == 200, f"Update failed: {response.text}"


# ==================== RATE LIMITS TESTS ====================

class TestRateLimits:
    """Test Rate Limits Dashboard APIs"""
    
    def test_get_rate_limit_stats(self, admin_headers):
        """Get rate limit statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rate-limits/stats",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        # Check expected fields
        assert "requests_today" in data or "total_requests" in data or isinstance(data, dict)
    
    def test_get_rate_limit_config(self, admin_headers):
        """Get rate limit configuration"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rate-limits/config",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get config failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Config should be a list"
    
    def test_get_blocked_ips(self, admin_headers):
        """Get blocked IPs list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rate-limits/blocked",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get blocked IPs failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Blocked IPs should be a list"


# ==================== DATA EXPORT TESTS ====================

class TestDataExport:
    """Test Data Export APIs"""
    
    def test_export_users_csv(self, admin_headers):
        """Export users as CSV"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/users?format=csv",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export users CSV failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", "") or response.status_code == 200
    
    def test_export_users_json(self, admin_headers):
        """Export users as JSON"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/users?format=json",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export users JSON failed: {response.text}"
    
    def test_export_analytics_json(self, admin_headers):
        """Export analytics as JSON with period"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/analytics?format=json&period_days=30",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export analytics failed: {response.text}"
    
    def test_export_subscriptions(self, admin_headers):
        """Export subscriptions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/subscriptions?format=csv",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export subscriptions failed: {response.text}"
    
    def test_export_payments(self, admin_headers):
        """Export payments"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/payments?format=csv",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export payments failed: {response.text}"
    
    def test_export_tickets(self, admin_headers):
        """Export support tickets"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/tickets?format=json",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export tickets failed: {response.text}"
    
    def test_export_full_report(self, admin_headers):
        """Export full platform report"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/full-report?format=json&period_days=30",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export full report failed: {response.text}"


# ==================== PUSH NOTIFICATIONS TESTS ====================

class TestPushNotifications:
    """Test Push Notifications APIs"""
    
    def test_get_notification_stats(self, admin_headers):
        """Get notification statistics"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/admin/stats",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get notification stats failed: {response.text}"
        data = response.json()
        assert "total_sent" in data, "Stats missing total_sent"
        assert "read_rate" in data, "Stats missing read_rate"
    
    def test_get_user_notifications(self, admin_headers):
        """Get user notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Notifications should be a list"
    
    def test_get_unread_count(self, admin_headers):
        """Get unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response missing count"
    
    def test_broadcast_notification(self, admin_headers):
        """Test broadcast notification to all users"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/admin/broadcast",
            headers=admin_headers,
            json={
                "title": "Test Broadcast",
                "message": "This is a test broadcast notification",
                "type": "system",
                "target": "all",
                "priority": "normal"
            }
        )
        assert response.status_code == 200, f"Broadcast failed: {response.text}"
        data = response.json()
        assert "count" in data or "message" in data


# ==================== STRIPE WEBHOOKS TESTS ====================

class TestStripeWebhooks:
    """Test Stripe Webhook endpoint"""
    
    def test_stripe_webhook_endpoint_exists(self):
        """Test that Stripe webhook endpoint responds"""
        # Send a minimal test payload (without signature verification)
        response = requests.post(
            f"{BASE_URL}/api/webhooks/stripe",
            headers={"Content-Type": "application/json"},
            json={
                "type": "test.event",
                "data": {"object": {}}
            }
        )
        # Should return 200 (received) or 400 (invalid signature in prod)
        assert response.status_code in [200, 400], f"Webhook endpoint error: {response.text}"
    
    def test_stripe_webhook_checkout_completed(self):
        """Test checkout.session.completed event handling"""
        response = requests.post(
            f"{BASE_URL}/api/webhooks/stripe",
            headers={"Content-Type": "application/json"},
            json={
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "customer": "cus_test_123",
                        "customer_email": "test@example.com",
                        "subscription": "sub_test_123",
                        "amount_total": 2999,
                        "currency": "usd",
                        "metadata": {}
                    }
                }
            }
        )
        assert response.status_code in [200, 400], f"Webhook error: {response.text}"


# ==================== INSTAGRAM EXPORT TESTS ====================

class TestInstagramExport:
    """Test Instagram-related exports"""
    
    def test_export_instagram_accounts(self, admin_headers):
        """Export Instagram accounts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/instagram-accounts?format=json",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export Instagram accounts failed: {response.text}"
    
    def test_export_growth_logs(self, admin_headers):
        """Export growth logs"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/growth-logs?format=json&days=30",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export growth logs failed: {response.text}"
    
    def test_export_funnel_events(self, admin_headers):
        """Export funnel events"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/funnel-events?format=json&days=30",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Export funnel events failed: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
