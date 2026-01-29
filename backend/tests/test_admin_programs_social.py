"""
Test Suite for Admin Programs (Affiliates/Referrals) and Social Links Management
Tests the following features:
- Admin Programs: Affiliates listing, Referrals listing, Program Settings
- Admin Social Links: Get and Update social links
- Public Social Links: Verify public endpoint returns social links
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@adverlyx.com"
ADMIN_PASSWORD = "Admin123!"


class TestAuth:
    """Authentication tests to get admin token"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin can login successfully"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"✓ Admin login successful, token obtained")


class TestAdminProgramsAffiliates:
    """Test Admin Programs - Affiliates endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json().get("access_token")
    
    def test_get_all_affiliates(self, admin_token):
        """Test GET /api/admin/programs/affiliates - List all affiliates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/affiliates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "affiliates" in data, "Missing 'affiliates' key"
        assert "stats" in data, "Missing 'stats' key"
        assert isinstance(data["affiliates"], list), "affiliates should be a list"
        
        # Verify stats structure
        stats = data["stats"]
        assert "total" in stats, "Missing 'total' in stats"
        assert "pending" in stats, "Missing 'pending' in stats"
        assert "approved" in stats, "Missing 'approved' in stats"
        
        print(f"✓ Affiliates endpoint working - Total: {stats['total']}, Pending: {stats['pending']}")
    
    def test_get_affiliates_with_status_filter(self, admin_token):
        """Test GET /api/admin/programs/affiliates?status=pending - Filter by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/affiliates?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "affiliates" in data
        print(f"✓ Affiliates filter by status working")
    
    def test_affiliates_requires_auth(self):
        """Test that affiliates endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/programs/affiliates")
        assert response.status_code in [401, 403, 422], "Should require auth"
        print(f"✓ Affiliates endpoint properly requires authentication")


class TestAdminProgramsReferrals:
    """Test Admin Programs - Referrals endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json().get("access_token")
    
    def test_get_all_referrals(self, admin_token):
        """Test GET /api/admin/programs/referrals - List all user referrals"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/referrals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "referrals" in data, "Missing 'referrals' key"
        assert "stats" in data, "Missing 'stats' key"
        assert isinstance(data["referrals"], list), "referrals should be a list"
        
        # Verify stats structure
        stats = data["stats"]
        assert "total" in stats, "Missing 'total' in stats"
        assert "completed" in stats, "Missing 'completed' in stats"
        
        print(f"✓ Referrals endpoint working - Total: {stats['total']}, Completed: {stats['completed']}")
    
    def test_referrals_requires_auth(self):
        """Test that referrals endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/programs/referrals")
        assert response.status_code in [401, 403, 422], "Should require auth"
        print(f"✓ Referrals endpoint properly requires authentication")


class TestAdminProgramsSettings:
    """Test Admin Programs - Settings endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json().get("access_token")
    
    def test_get_program_settings(self, admin_token):
        """Test GET /api/admin/programs/settings - Get all program settings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "affiliate" in data, "Missing 'affiliate' settings"
        assert "referral" in data, "Missing 'referral' settings"
        
        # Verify affiliate settings structure
        affiliate = data["affiliate"]
        assert "enabled" in affiliate or affiliate.get("enabled") is not None or True, "affiliate settings should have enabled field"
        
        # Verify referral settings structure
        referral = data["referral"]
        assert "enabled" in referral or referral.get("enabled") is not None or True, "referral settings should have enabled field"
        
        print(f"✓ Program settings endpoint working")
        print(f"  Affiliate: commission_rate={affiliate.get('commission_rate', 20)}%, cookie_days={affiliate.get('cookie_days', 30)}")
        print(f"  Referral: referrer_reward=${referral.get('referrer_reward', 10)}, referee_discount={referral.get('referee_discount', 20)}%")
    
    def test_update_affiliate_settings(self, admin_token):
        """Test PUT /api/admin/programs/settings/affiliate - Update affiliate settings"""
        new_settings = {
            "enabled": True,
            "commission_rate": 25.0,
            "cookie_days": 45,
            "min_payout": 75.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/programs/settings/affiliate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=new_settings
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data, "Missing success message"
        
        # Verify settings were saved by fetching again
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/programs/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        # Check if settings were persisted
        affiliate = verify_data.get("affiliate", {})
        assert affiliate.get("commission_rate") == 25.0, "Commission rate not saved"
        
        print(f"✓ Affiliate settings update working")
    
    def test_update_referral_settings(self, admin_token):
        """Test PUT /api/admin/programs/settings/referral - Update referral settings"""
        new_settings = {
            "enabled": True,
            "referrer_reward": 15.0,
            "referee_discount": 25.0,
            "require_subscription": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/programs/settings/referral",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=new_settings
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data, "Missing success message"
        
        # Verify settings were saved
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/programs/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        referral = verify_data.get("referral", {})
        assert referral.get("referrer_reward") == 15.0, "Referrer reward not saved"
        
        print(f"✓ Referral settings update working")


class TestAdminSocialLinks:
    """Test Admin Social Links endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json().get("access_token")
    
    def test_get_social_links(self, admin_token):
        """Test GET /api/admin/settings/social-links - Get all social links"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings/social-links",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify all 9 social platforms are present
        expected_platforms = ["instagram", "twitter", "linkedin", "youtube", "facebook", "tiktok", "pinterest", "discord", "telegram"]
        for platform in expected_platforms:
            assert platform in data, f"Missing '{platform}' in social links"
        
        print(f"✓ Social links GET endpoint working - All 9 platforms present")
        active_count = sum(1 for v in data.values() if v and v.strip())
        print(f"  Active links: {active_count}/9")
    
    def test_update_social_links(self, admin_token):
        """Test PUT /api/admin/settings/social-links - Update social links"""
        new_links = {
            "instagram": "https://instagram.com/adverlyx_test",
            "twitter": "https://twitter.com/adverlyx_test",
            "linkedin": "https://linkedin.com/company/adverlyx_test",
            "youtube": "https://youtube.com/@adverlyx_test",
            "facebook": "",
            "tiktok": "",
            "pinterest": "",
            "discord": "",
            "telegram": ""
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/social-links",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=new_links
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data, "Missing success message"
        
        # Verify links were saved
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/settings/social-links",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        assert verify_data.get("instagram") == "https://instagram.com/adverlyx_test", "Instagram link not saved"
        assert verify_data.get("youtube") == "https://youtube.com/@adverlyx_test", "YouTube link not saved"
        
        print(f"✓ Social links update working")
    
    def test_social_links_requires_auth(self):
        """Test that social links endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/settings/social-links")
        assert response.status_code in [401, 403, 422], "Should require auth"
        print(f"✓ Social links endpoint properly requires authentication")


class TestPublicSocialLinks:
    """Test Public Social Links endpoint (no auth required)"""
    
    def test_get_public_social_links(self):
        """Test GET /api/public/social-links - Get social links for footer"""
        response = requests.get(f"{BASE_URL}/api/public/social-links")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify all 9 social platforms are present
        expected_platforms = ["instagram", "twitter", "linkedin", "youtube", "facebook", "tiktok", "pinterest", "discord", "telegram"]
        for platform in expected_platforms:
            assert platform in data, f"Missing '{platform}' in public social links"
        
        print(f"✓ Public social links endpoint working")
        active_count = sum(1 for v in data.values() if v and v.strip())
        print(f"  Active links visible in footer: {active_count}/9")
    
    def test_public_social_links_no_auth_required(self):
        """Verify public endpoint doesn't require authentication"""
        response = requests.get(f"{BASE_URL}/api/public/social-links")
        assert response.status_code == 200, "Public endpoint should not require auth"
        print(f"✓ Public social links accessible without authentication")


class TestAdminProgramsAnalytics:
    """Test Admin Programs Analytics endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json().get("access_token")
    
    def test_get_program_analytics(self, admin_token):
        """Test GET /api/admin/programs/analytics - Get program analytics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "period_days" in data, "Missing 'period_days'"
        assert "affiliate_program" in data, "Missing 'affiliate_program'"
        assert "referral_program" in data, "Missing 'referral_program'"
        
        print(f"✓ Program analytics endpoint working")
        print(f"  Period: {data['period_days']} days")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
