import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { shouldEndNonRememberedSession, clearSessionMarkers, markSessionActive } from '@/lib/authSession';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    // "Remember me" unchecked: that login was scoped to the browser window.
    // If the browser was closed (sessionStorage marker gone), end the session
    // instead of silently restoring it. Otherwise the Base44 session is
    // persistent and is always restored below.
    if (shouldEndNonRememberedSession()) {
      clearSessionMarkers();
      try { await base44.auth.logout(); } catch (e) { /* no session to end */ }
    }

    try {
      const publicSettings = await base44.app.getPublicSettings();
      setAppPublicSettings(publicSettings);

      // Always check the stored session: the SDK persists the auth token in
      // localStorage, so a valid session is restored automatically on every
      // app start (page refresh, new tab, closing and reopening the browser,
      // returning later). No forced logout unless the session is invalid.
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error('App state check failed:', appError);

      if (appError.status === 403 && appError.data?.extra_data?.reason) {
        const reason = appError.data.extra_data.reason;
        if (reason === 'auth_required') {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else if (reason === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
        } else {
          setAuthError({ type: reason, message: appError.message });
        }
      } else if (!appError.status) {
        // Network problem — never treat as a logout; the stored session
        // stays intact and is restored on retry.
        setAuthError({ type: 'network', message: 'Unable to connect' });
      } else {
        setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
      }
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    const succeed = (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(true);
      markSessionActive();
      setIsLoadingAuth(false);
      setAuthChecked(true);
    };
    const fail = (error) => {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (!error.status) {
        // Network problem — keep the stored token so the session is
        // restored once connectivity returns (no forced logout).
        setAuthError({ type: 'network', message: 'Unable to connect' });
        return;
      }
      const reason = error.data?.extra_data?.reason;
      if (reason === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
      } else if (error.status === 401 || error.status === 403) {
        // Session genuinely invalid/expired — the user must sign in again.
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'unknown', message: error.message || 'Authentication check failed' });
      }
    };

    setIsLoadingAuth(true);
    const hasStoredToken = !!appParams.token ||
      (typeof base44.auth.hasToken === 'function' && base44.auth.hasToken());
    if (!hasStoredToken) {
      // No stored session: clean anonymous state. Protected routes show the
      // login page — no logged-out flicker for anyone with a valid session,
      // and no auth error for first-time visitors.
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      const currentUser = await base44.auth.me();
      succeed(currentUser);
    } catch (error) {
      if (!error.status) {
        // Transient network issue — retry once before surfacing an error.
        try {
          const retried = await base44.auth.me();
          succeed(retried);
        } catch (retryError) {
          fail(retryError);
        }
        return;
      }
      fail(error);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    clearSessionMarkers();
    if (shouldRedirect) {
      // SDK logout clears the stored token and redirects to the login page.
      // Business/project data is untouched — it is restored on next sign-in.
      base44.auth.logout('/login');
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};