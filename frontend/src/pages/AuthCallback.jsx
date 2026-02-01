import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/**
 * AuthCallback - Handles Google OAuth callback
 * Receives authorization code from Google and exchanges it for tokens
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setIsAuthenticated } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam);
          toast.error('Google sign-in was cancelled');
          navigate('/login');
          return;
        }

        if (!code) {
          console.error('No authorization code in URL');
          setError('No authorization code received');
          toast.error('Authentication failed');
          navigate('/login');
          return;
        }

        console.log('Processing Google OAuth code...');
        
        // Get the redirect URI (must match what was used to initiate OAuth)
        const redirectUri = window.location.origin + '/auth/callback';

        // Exchange code for tokens
        const response = await authAPI.googleCallback(code, redirectUri);
        const { access_token, refresh_token, user } = response.data;

        // Store tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Update auth context
        setUser(user);
        setIsAuthenticated(true);

        toast.success(`Welcome${user.name ? ', ' + user.name : ''}!`);
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error.response?.data?.detail || 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Wait a moment before redirecting
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processOAuthCallback();
  }, [navigate, searchParams, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-400">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Signing you in...</h2>
            <p className="text-gray-400">Please wait while we complete your authentication</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
