/** @jsxImportSource react */
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect, useState } from "react";
import { API_BASE } from './apiBase';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://accounts.google.com',
  'https://*.googleusercontent.com'
];

// Allow all origins in development mode
if (import.meta.env.DEV) {
  ALLOWED_ORIGINS.push(window.location.origin);
}

export const GoogleAuthConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentOrigin = window.location.origin;
    console.debug('[DEBUG] GoogleAuthConfig.tsx: Current origin:', currentOrigin);
    
    if (!ALLOWED_ORIGINS.includes(currentOrigin)) {
      console.error(`Error: Current origin ${currentOrigin} is not in the allowed list for Google OAuth.`);
      setError(`Origin ${currentOrigin} is not allowed for Google OAuth. Please contact support.`);
      return;
    }

    console.debug('[DEBUG] GoogleAuthConfig.tsx: Fetching Google OAuth Client ID from /api/google-client-id');
    fetch(`${API_BASE}/api/google-client-id`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch client ID: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.clientId) {
          console.debug('[DEBUG] GoogleAuthConfig.tsx: Google OAuth Client ID fetched. First 5 chars:', data.clientId.substring(0, 5));
          setClientId(data.clientId);
        } else {
          throw new Error('Google OAuth Client ID not found in response');
        }
      })
      .catch((err) => {
        console.error('[DEBUG] GoogleAuthConfig.tsx: Failed to fetch Google OAuth Client ID:', err);
        setError(err.message);
        setClientId(null);
      });
  }, []);

  useEffect(() => {
    // Verify current origin is allowed and construct redirect URI
    const currentOrigin = window.location.origin;
    const redirectUri = `${currentOrigin}/auth/google/callback`;
    
    if (!ALLOWED_ORIGINS.includes(currentOrigin)) {
      console.error(`Error: Current origin ${currentOrigin} is not in the allowed list for Google OAuth. Please ensure this redirect URI is configured in Google Cloud Console: ${redirectUri}`);
      return;
    }

    // Handle potential Google Sign-In errors gracefully
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known Google Sign-In errors in development
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('GSI_LOGGER') || 
         args[0].includes('Failed to execute \'postMessage\'') ||
         args[0].includes('Error retrieving a token'))
      ) {
        // Log warning instead of error in development
        if (import.meta.env.DEV) {
          console.warn('Google Sign-In development warning:', args[0]);
          return;
        }
      }
      
      // Provide helpful guidance for common initialization errors
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        args[0].includes('Initialization error:')
      ) {
        const errorMessage = args[0];
        
        // For event not found errors in incognito mode
        if (errorMessage.includes('Event not found') && isIncognitoMode()) {
          console.warn('Event access error in private/incognito mode. Try opening the link in a regular browser window or ensure the URL contains a valid eventId parameter.');
        } else {
          originalError.apply(console, args);
        }
        return;
      }
      
      originalError.apply(console, args);
    };
    
    // Helper to detect incognito/private mode
    const isIncognitoMode = () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return false;
      } catch (e) {
        return true;
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Add a listener for Google OAuth errors
  useEffect(() => {
    const handleOAuthError = (event: MessageEvent) => {
      if (
        event.data && 
        typeof event.data === 'object' && 
        event.data.type === 'oauth_error'
      ) {
        console.warn('Google OAuth error detected:', event.data.error);
        // Could display a user-friendly message here
      }
    };

    window.addEventListener('message', handleOAuthError);
    return () => window.removeEventListener('message', handleOAuthError);
  }, []);

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (clientId === null) {
    return <div>Loading...</div>;
  }

  return (
    <GoogleOAuthProvider 
      clientId={clientId}
      onScriptLoadError={() => {
        console.error("Google Sign-In script failed to load");
        setError("Failed to load Google Sign-In. Please refresh the page.");
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
};