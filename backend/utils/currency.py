"""
Currency detection and conversion utility for Adverlyx Digital.
Auto-detects client currency based on IP geolocation.
"""
import os
import httpx
from typing import Optional, Dict
from functools import lru_cache

# Currency configuration by country
COUNTRY_CURRENCIES = {
    # Asia
    "IN": {"currency": "INR", "symbol": "₹", "name": "Indian Rupee"},
    "JP": {"currency": "JPY", "symbol": "¥", "name": "Japanese Yen"},
    "CN": {"currency": "CNY", "symbol": "¥", "name": "Chinese Yuan"},
    "KR": {"currency": "KRW", "symbol": "₩", "name": "South Korean Won"},
    "SG": {"currency": "SGD", "symbol": "S$", "name": "Singapore Dollar"},
    "MY": {"currency": "MYR", "symbol": "RM", "name": "Malaysian Ringgit"},
    "TH": {"currency": "THB", "symbol": "฿", "name": "Thai Baht"},
    "ID": {"currency": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah"},
    "PH": {"currency": "PHP", "symbol": "₱", "name": "Philippine Peso"},
    "VN": {"currency": "VND", "symbol": "₫", "name": "Vietnamese Dong"},
    "AE": {"currency": "AED", "symbol": "د.إ", "name": "UAE Dirham"},
    "SA": {"currency": "SAR", "symbol": "﷼", "name": "Saudi Riyal"},
    
    # Europe
    "GB": {"currency": "GBP", "symbol": "£", "name": "British Pound"},
    "DE": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "FR": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "IT": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "ES": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "NL": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "BE": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "AT": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "PT": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "IE": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "FI": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "GR": {"currency": "EUR", "symbol": "€", "name": "Euro"},
    "CH": {"currency": "CHF", "symbol": "CHF", "name": "Swiss Franc"},
    "SE": {"currency": "SEK", "symbol": "kr", "name": "Swedish Krona"},
    "NO": {"currency": "NOK", "symbol": "kr", "name": "Norwegian Krone"},
    "DK": {"currency": "DKK", "symbol": "kr", "name": "Danish Krone"},
    "PL": {"currency": "PLN", "symbol": "zł", "name": "Polish Zloty"},
    "RU": {"currency": "RUB", "symbol": "₽", "name": "Russian Ruble"},
    
    # Americas
    "US": {"currency": "USD", "symbol": "$", "name": "US Dollar"},
    "CA": {"currency": "CAD", "symbol": "C$", "name": "Canadian Dollar"},
    "MX": {"currency": "MXN", "symbol": "$", "name": "Mexican Peso"},
    "BR": {"currency": "BRL", "symbol": "R$", "name": "Brazilian Real"},
    "AR": {"currency": "ARS", "symbol": "$", "name": "Argentine Peso"},
    "CL": {"currency": "CLP", "symbol": "$", "name": "Chilean Peso"},
    "CO": {"currency": "COP", "symbol": "$", "name": "Colombian Peso"},
    
    # Oceania
    "AU": {"currency": "AUD", "symbol": "A$", "name": "Australian Dollar"},
    "NZ": {"currency": "NZD", "symbol": "NZ$", "name": "New Zealand Dollar"},
    
    # Africa
    "ZA": {"currency": "ZAR", "symbol": "R", "name": "South African Rand"},
    "NG": {"currency": "NGN", "symbol": "₦", "name": "Nigerian Naira"},
    "EG": {"currency": "EGP", "symbol": "E£", "name": "Egyptian Pound"},
    "KE": {"currency": "KES", "symbol": "KSh", "name": "Kenyan Shilling"},
}

# Default currency
DEFAULT_CURRENCY = {"currency": "USD", "symbol": "$", "name": "US Dollar"}

# Exchange rates (approximate, should be updated from API in production)
# Base currency: USD
EXCHANGE_RATES = {
    "USD": 1.0,
    "INR": 83.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.36,
    "AUD": 1.53,
    "JPY": 149.0,
    "CNY": 7.24,
    "SGD": 1.34,
    "AED": 3.67,
    "SAR": 3.75,
    "MYR": 4.47,
    "THB": 35.5,
    "IDR": 15800.0,
    "PHP": 56.0,
    "VND": 24500.0,
    "KRW": 1320.0,
    "CHF": 0.88,
    "SEK": 10.5,
    "NOK": 10.8,
    "DKK": 6.9,
    "PLN": 4.0,
    "RUB": 92.0,
    "MXN": 17.2,
    "BRL": 4.97,
    "ZAR": 18.5,
    "NZD": 1.64,
    "HKD": 7.82,
}

# Supported payment currencies by provider
STRIPE_SUPPORTED_CURRENCIES = [
    "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "HKD", "NZD", 
    "SEK", "NOK", "DKK", "CHF", "MXN", "BRL", "INR", "MYR", "PLN"
]

RAZORPAY_SUPPORTED_CURRENCIES = ["INR"]  # Razorpay primarily supports INR


async def get_country_from_ip(ip_address: str) -> Optional[str]:
    """Get country code from IP address using free IP geolocation API."""
    # Skip for localhost/private IPs
    if ip_address in ["127.0.0.1", "localhost", "::1"] or ip_address.startswith(("10.", "192.168.", "172.")):
        return None
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Using ip-api.com (free, no API key needed, 45 requests/minute)
            response = await client.get(f"http://ip-api.com/json/{ip_address}?fields=countryCode")
            if response.status_code == 200:
                data = response.json()
                return data.get("countryCode")
    except Exception:
        pass
    
    return None


def get_currency_for_country(country_code: str) -> Dict:
    """Get currency info for a country code."""
    if country_code and country_code.upper() in COUNTRY_CURRENCIES:
        return COUNTRY_CURRENCIES[country_code.upper()]
    return DEFAULT_CURRENCY


def convert_amount(amount_usd: float, target_currency: str) -> float:
    """Convert USD amount to target currency."""
    rate = EXCHANGE_RATES.get(target_currency, 1.0)
    converted = amount_usd * rate
    
    # Round appropriately based on currency
    if target_currency in ["JPY", "KRW", "VND", "IDR"]:
        return round(converted)  # No decimals for these currencies
    return round(converted, 2)


def get_payment_provider_for_currency(currency: str) -> str:
    """Determine which payment provider to use based on currency."""
    if currency == "INR":
        return "razorpay"  # Use Razorpay for INR
    elif currency in STRIPE_SUPPORTED_CURRENCIES:
        return "stripe"
    else:
        return "stripe"  # Default to Stripe, will convert to USD


def format_price(amount: float, currency: str) -> str:
    """Format price with currency symbol."""
    currency_info = None
    for country_data in COUNTRY_CURRENCIES.values():
        if country_data["currency"] == currency:
            currency_info = country_data
            break
    
    if not currency_info:
        currency_info = DEFAULT_CURRENCY
    
    symbol = currency_info["symbol"]
    
    # Format based on currency conventions
    if currency in ["JPY", "KRW", "VND", "IDR"]:
        return f"{symbol}{int(amount):,}"
    return f"{symbol}{amount:,.2f}"


async def get_localized_pricing(ip_address: str, base_prices_usd: Dict[str, float]) -> Dict:
    """
    Get localized pricing based on client IP.
    
    Args:
        ip_address: Client IP address
        base_prices_usd: Dict of plan_key -> price in USD
        
    Returns:
        Dict with currency info and converted prices
    """
    # Get country from IP
    country_code = await get_country_from_ip(ip_address)
    
    # Get currency for country
    currency_info = get_currency_for_country(country_code)
    currency = currency_info["currency"]
    
    # Determine payment provider
    provider = get_payment_provider_for_currency(currency)
    
    # Convert all prices
    converted_prices = {}
    for plan_key, price_usd in base_prices_usd.items():
        converted_prices[plan_key] = convert_amount(price_usd, currency)
    
    return {
        "country_code": country_code,
        "currency": currency,
        "currency_symbol": currency_info["symbol"],
        "currency_name": currency_info["name"],
        "payment_provider": provider,
        "prices": converted_prices,
        "exchange_rate": EXCHANGE_RATES.get(currency, 1.0)
    }


# Plan pricing in USD (base prices)
BASE_PLAN_PRICES_USD = {
    "basic_monthly": 49.00,
    "basic_yearly": 29.00 * 12,  # 348
    "pro_monthly": 69.00,
    "pro_yearly": 41.00 * 12,  # 492
    "enterprise_monthly": 149.00,
    "enterprise_yearly": 99.00 * 12,  # 1188
}
