"""
Multi-language Support System (i18n)
Internationalization for the platform
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, Dict
import logging

from utils.auth import get_current_user
from models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/i18n", tags=["Internationalization"])

db = None

def init_router(database):
    global db
    db = database


# ============== Supported Languages ==============

SUPPORTED_LANGUAGES = {
    "en": {"name": "English", "native": "English", "direction": "ltr"},
    "es": {"name": "Spanish", "native": "Español", "direction": "ltr"},
    "fr": {"name": "French", "native": "Français", "direction": "ltr"},
    "de": {"name": "German", "native": "Deutsch", "direction": "ltr"},
    "pt": {"name": "Portuguese", "native": "Português", "direction": "ltr"},
    "it": {"name": "Italian", "native": "Italiano", "direction": "ltr"},
    "nl": {"name": "Dutch", "native": "Nederlands", "direction": "ltr"},
    "ru": {"name": "Russian", "native": "Русский", "direction": "ltr"},
    "ja": {"name": "Japanese", "native": "日本語", "direction": "ltr"},
    "ko": {"name": "Korean", "native": "한국어", "direction": "ltr"},
    "zh": {"name": "Chinese", "native": "中文", "direction": "ltr"},
    "ar": {"name": "Arabic", "native": "العربية", "direction": "rtl"},
    "hi": {"name": "Hindi", "native": "हिन्दी", "direction": "ltr"},
    "tr": {"name": "Turkish", "native": "Türkçe", "direction": "ltr"},
}


# ============== Default Translations ==============

DEFAULT_TRANSLATIONS = {
    "en": {
        # Navigation
        "nav.home": "Home",
        "nav.pricing": "Pricing",
        "nav.dashboard": "Dashboard",
        "nav.login": "Login",
        "nav.signup": "Sign Up",
        "nav.logout": "Logout",
        "nav.settings": "Settings",
        "nav.support": "Support",
        
        # Hero Section
        "hero.title": "Grow Your Instagram Following",
        "hero.subtitle": "AI-powered growth service to get real, engaged followers",
        "hero.cta": "Get Started",
        "hero.cta_secondary": "Learn More",
        
        # Pricing
        "pricing.title": "Simple, Transparent Pricing",
        "pricing.subtitle": "Choose the plan that works for you",
        "pricing.monthly": "Monthly",
        "pricing.yearly": "Yearly",
        "pricing.save": "Save",
        "pricing.popular": "Most Popular",
        "pricing.get_started": "Get Started",
        "pricing.features": "Features",
        "pricing.per_month": "/month",
        "pricing.per_year": "/year",
        
        # Auth
        "auth.login_title": "Welcome Back",
        "auth.login_subtitle": "Sign in to your account",
        "auth.signup_title": "Create Account",
        "auth.signup_subtitle": "Start growing your Instagram",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.confirm_password": "Confirm Password",
        "auth.name": "Full Name",
        "auth.forgot_password": "Forgot password?",
        "auth.no_account": "Don't have an account?",
        "auth.have_account": "Already have an account?",
        "auth.or_continue": "Or continue with",
        
        # Dashboard
        "dashboard.title": "Dashboard",
        "dashboard.welcome": "Welcome back",
        "dashboard.overview": "Overview",
        "dashboard.analytics": "Analytics",
        "dashboard.billing": "Billing",
        "dashboard.settings": "Settings",
        "dashboard.support": "Support",
        "dashboard.followers": "Followers",
        "dashboard.following": "Following",
        "dashboard.posts": "Posts",
        "dashboard.engagement": "Engagement",
        "dashboard.growth": "Growth",
        
        # Common
        "common.loading": "Loading...",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.view": "View",
        "common.search": "Search",
        "common.filter": "Filter",
        "common.export": "Export",
        "common.refresh": "Refresh",
        "common.submit": "Submit",
        "common.close": "Close",
        "common.confirm": "Confirm",
        "common.success": "Success",
        "common.error": "Error",
        "common.warning": "Warning",
        
        # Errors
        "error.generic": "Something went wrong",
        "error.network": "Network error. Please try again.",
        "error.unauthorized": "Please login to continue",
        "error.not_found": "Not found",
        "error.validation": "Please check your input",
        
        # Footer
        "footer.privacy": "Privacy Policy",
        "footer.terms": "Terms of Service",
        "footer.refund": "Refund Policy",
        "footer.contact": "Contact Us",
        "footer.copyright": "All rights reserved",
    },
    "es": {
        "nav.home": "Inicio",
        "nav.pricing": "Precios",
        "nav.dashboard": "Panel",
        "nav.login": "Iniciar Sesión",
        "nav.signup": "Registrarse",
        "nav.logout": "Cerrar Sesión",
        "nav.settings": "Configuración",
        "nav.support": "Soporte",
        
        "hero.title": "Haz Crecer Tu Instagram",
        "hero.subtitle": "Servicio de crecimiento impulsado por IA para obtener seguidores reales",
        "hero.cta": "Comenzar",
        "hero.cta_secondary": "Saber Más",
        
        "pricing.title": "Precios Simples y Transparentes",
        "pricing.subtitle": "Elige el plan que funcione para ti",
        "pricing.monthly": "Mensual",
        "pricing.yearly": "Anual",
        "pricing.save": "Ahorra",
        "pricing.popular": "Más Popular",
        "pricing.get_started": "Comenzar",
        "pricing.features": "Características",
        "pricing.per_month": "/mes",
        "pricing.per_year": "/año",
        
        "auth.login_title": "Bienvenido de Nuevo",
        "auth.login_subtitle": "Inicia sesión en tu cuenta",
        "auth.signup_title": "Crear Cuenta",
        "auth.signup_subtitle": "Empieza a crecer tu Instagram",
        "auth.email": "Correo Electrónico",
        "auth.password": "Contraseña",
        "auth.confirm_password": "Confirmar Contraseña",
        "auth.name": "Nombre Completo",
        "auth.forgot_password": "¿Olvidaste tu contraseña?",
        "auth.no_account": "¿No tienes una cuenta?",
        "auth.have_account": "¿Ya tienes una cuenta?",
        "auth.or_continue": "O continuar con",
        
        "dashboard.title": "Panel de Control",
        "dashboard.welcome": "Bienvenido de nuevo",
        "dashboard.overview": "Resumen",
        "dashboard.analytics": "Analíticas",
        "dashboard.billing": "Facturación",
        "dashboard.settings": "Configuración",
        "dashboard.support": "Soporte",
        "dashboard.followers": "Seguidores",
        "dashboard.following": "Siguiendo",
        "dashboard.posts": "Publicaciones",
        "dashboard.engagement": "Interacción",
        "dashboard.growth": "Crecimiento",
        
        "common.loading": "Cargando...",
        "common.save": "Guardar",
        "common.cancel": "Cancelar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "common.view": "Ver",
        "common.search": "Buscar",
        "common.filter": "Filtrar",
        "common.export": "Exportar",
        "common.refresh": "Actualizar",
        "common.submit": "Enviar",
        "common.close": "Cerrar",
        "common.confirm": "Confirmar",
        "common.success": "Éxito",
        "common.error": "Error",
        "common.warning": "Advertencia",
        
        "error.generic": "Algo salió mal",
        "error.network": "Error de red. Por favor intenta de nuevo.",
        "error.unauthorized": "Por favor inicia sesión para continuar",
        "error.not_found": "No encontrado",
        "error.validation": "Por favor verifica tu entrada",
        
        "footer.privacy": "Política de Privacidad",
        "footer.terms": "Términos de Servicio",
        "footer.refund": "Política de Reembolso",
        "footer.contact": "Contáctanos",
        "footer.copyright": "Todos los derechos reservados",
    },
    "fr": {
        "nav.home": "Accueil",
        "nav.pricing": "Tarifs",
        "nav.dashboard": "Tableau de Bord",
        "nav.login": "Connexion",
        "nav.signup": "S'inscrire",
        "nav.logout": "Déconnexion",
        "nav.settings": "Paramètres",
        "nav.support": "Support",
        
        "hero.title": "Développez Votre Instagram",
        "hero.subtitle": "Service de croissance alimenté par l'IA pour obtenir de vrais abonnés",
        "hero.cta": "Commencer",
        "hero.cta_secondary": "En Savoir Plus",
        
        "pricing.title": "Tarification Simple et Transparente",
        "pricing.subtitle": "Choisissez le plan qui vous convient",
        "pricing.monthly": "Mensuel",
        "pricing.yearly": "Annuel",
        "pricing.save": "Économisez",
        "pricing.popular": "Le Plus Populaire",
        "pricing.get_started": "Commencer",
        
        "common.loading": "Chargement...",
        "common.save": "Enregistrer",
        "common.cancel": "Annuler",
        "common.delete": "Supprimer",
        "common.success": "Succès",
        "common.error": "Erreur",
    },
    "de": {
        "nav.home": "Startseite",
        "nav.pricing": "Preise",
        "nav.dashboard": "Dashboard",
        "nav.login": "Anmelden",
        "nav.signup": "Registrieren",
        "nav.logout": "Abmelden",
        
        "hero.title": "Erweitern Sie Ihre Instagram-Follower",
        "hero.subtitle": "KI-gestützter Wachstumsservice für echte, engagierte Follower",
        "hero.cta": "Jetzt Starten",
        
        "pricing.title": "Einfache, Transparente Preise",
        "pricing.monthly": "Monatlich",
        "pricing.yearly": "Jährlich",
        
        "common.loading": "Laden...",
        "common.save": "Speichern",
        "common.cancel": "Abbrechen",
    },
    "pt": {
        "nav.home": "Início",
        "nav.pricing": "Preços",
        "nav.dashboard": "Painel",
        "nav.login": "Entrar",
        "nav.signup": "Cadastrar",
        "nav.logout": "Sair",
        
        "hero.title": "Cresça Seus Seguidores do Instagram",
        "hero.subtitle": "Serviço de crescimento com IA para seguidores reais e engajados",
        "hero.cta": "Começar",
        
        "common.loading": "Carregando...",
        "common.save": "Salvar",
        "common.cancel": "Cancelar",
    },
    "hi": {
        "nav.home": "होम",
        "nav.pricing": "मूल्य",
        "nav.dashboard": "डैशबोर्ड",
        "nav.login": "लॉगिन",
        "nav.signup": "साइन अप",
        
        "hero.title": "अपने इंस्टाग्राम फॉलोअर्स बढ़ाएं",
        "hero.subtitle": "AI-संचालित ग्रोथ सर्विस",
        "hero.cta": "शुरू करें",
        
        "common.loading": "लोड हो रहा है...",
        "common.save": "सेव करें",
        "common.cancel": "रद्द करें",
    },
}


# ============== Models ==============

class TranslationUpdate(BaseModel):
    key: str
    value: str


class LanguageSettings(BaseModel):
    default_language: str = "en"
    enabled_languages: list = ["en"]
    auto_detect: bool = True


# ============== API Endpoints ==============

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages."""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "default": "en"
    }


@router.get("/translations/{lang}")
async def get_translations(lang: str):
    """Get translations for a specific language."""
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail=f"Language '{lang}' not supported")
    
    # Check database for custom translations
    custom_translations = await db.translations.find_one(
        {"language": lang},
        {"_id": 0}
    )
    
    # Merge with defaults
    translations = DEFAULT_TRANSLATIONS.get(lang, DEFAULT_TRANSLATIONS["en"]).copy()
    
    if custom_translations and custom_translations.get("translations"):
        translations.update(custom_translations["translations"])
    
    return {
        "language": lang,
        "language_info": SUPPORTED_LANGUAGES[lang],
        "translations": translations
    }


@router.get("/settings")
async def get_language_settings():
    """Get platform language settings."""
    settings = await db.site_settings.find_one(
        {"type": "language_settings"},
        {"_id": 0}
    )
    
    if not settings:
        settings = {
            "type": "language_settings",
            "default_language": "en",
            "enabled_languages": ["en", "es", "fr", "de", "pt", "hi"],
            "auto_detect": True
        }
    
    return settings


@router.put("/settings")
async def update_language_settings(
    settings: LanguageSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update language settings (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = settings.model_dump()
    update_data["type"] = "language_settings"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"type": "language_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Language settings updated"}


@router.put("/translations/{lang}")
async def update_translations(
    lang: str,
    translations: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """Update translations for a language (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail=f"Language '{lang}' not supported")
    
    await db.translations.update_one(
        {"language": lang},
        {"$set": {
            "language": lang,
            "translations": translations,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": current_user["user_id"]
        }},
        upsert=True
    )
    
    return {"message": f"Translations updated for {lang}"}


@router.post("/translations/{lang}/key")
async def update_single_translation(
    lang: str,
    update: TranslationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a single translation key (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.translations.update_one(
        {"language": lang},
        {"$set": {
            f"translations.{update.key}": update.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": f"Translation '{update.key}' updated for {lang}"}


@router.get("/user-preference")
async def get_user_language_preference(current_user: dict = Depends(get_current_user)):
    """Get user's language preference."""
    user = await db.users.find_one(
        {"id": current_user["user_id"]},
        {"_id": 0, "language": 1}
    )
    
    return {
        "language": user.get("language", "en") if user else "en"
    }


@router.put("/user-preference")
async def set_user_language_preference(
    lang: str,
    current_user: dict = Depends(get_current_user)
):
    """Set user's language preference."""
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Language '{lang}' not supported")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"language": lang}}
    )
    
    return {"message": f"Language preference set to {lang}"}


@router.get("/detect")
async def detect_language(request: Request):
    """Detect user's preferred language from headers."""
    accept_language = request.headers.get("Accept-Language", "en")
    
    # Parse Accept-Language header
    languages = []
    for lang in accept_language.split(","):
        parts = lang.strip().split(";")
        code = parts[0].split("-")[0].lower()
        q = 1.0
        if len(parts) > 1 and parts[1].startswith("q="):
            try:
                q = float(parts[1][2:])
            except ValueError:
                pass
        languages.append((code, q))
    
    # Sort by quality
    languages.sort(key=lambda x: x[1], reverse=True)
    
    # Find first supported language
    for code, _ in languages:
        if code in SUPPORTED_LANGUAGES:
            return {
                "detected_language": code,
                "language_info": SUPPORTED_LANGUAGES[code]
            }
    
    return {
        "detected_language": "en",
        "language_info": SUPPORTED_LANGUAGES["en"]
    }
