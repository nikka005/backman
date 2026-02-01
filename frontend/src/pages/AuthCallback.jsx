import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/**
 * AuthCallback - Handles Google OAuth callback from Emergent Auth
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthCallback = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id in URL');
          toast.error('Authentication failed - no session ID');
          navigate('/login');
          return;
        }

        console.log('Processing Google OAuth session...');

        // Exchange session_id for user data and tokens
        const response = await authAPI.googleSession(sessionId);
        const { access_token, refresh_token, user } = response.data;

        // Store tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Update auth context
        setUser(user);
        setIsAuthenticated(true);

        toast.success(`Welcome${user.name ? ', ' + user.name : ''}!`);
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true, state: { user } });

      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error.response?.data?.detail || 'Authentication failed';
        toast.error(errorMessage);
        navigate('/login');
      }
    };

    processOAuthCallback();
  }, [navigate, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Signing you in...</h2>
        <p className="text-gray-400">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
};

export default AuthCallback;
