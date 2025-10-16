import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyToken, refreshToken, revokeToken } from '../services/authService';
import axios from 'axios';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();

  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token found, authentication failed
      handleAuthFailure();
      setLoginAttempted(true);
      return false;
    }

    // If we just logged in, skip verification to avoid unnecessary API calls
    if (justLoggedIn) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
      setIsAuthenticated(true);
      setLoginAttempted(true);
      setJustLoggedIn(false);
      return true;
    }

    try {
      // Verify the current token is valid
      const response = await verifyToken();
      
      if (response.data && response.data.status === 200) {
        // Token is valid
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (e) {
            console.error('Failed to parse user data', e);
          }
        }
        setIsAuthenticated(true);
        setLoginAttempted(true);
        return true;
      } else {
        // Token is invalid, try refresh
        return await refreshAuthToken();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // Error occurred, try refresh
      return await refreshAuthToken();
    }
  }, [justLoggedIn]);

  const refreshAuthToken = async () => {
    try {
      // Attempt to use refresh token
      const response = await refreshToken();

      if (response.data && response.data.status === 200) {
        const newToken = response.data.data;
        localStorage.setItem('token', newToken);
        
        // If we have user data in response, update it
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
        } else {
          // Use existing user data if available
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              setUser(JSON.parse(userData));
            } catch (e) {
              console.error('Failed to parse user data', e);
            }
          }
        }
        
        setIsAuthenticated(true);
        setLoginAttempted(true);
        return true;
      } else {
        handleAuthFailure();
        setLoginAttempted(true);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      handleAuthFailure();
      setLoginAttempted(true);
      return false;
    }
  };

  const handleAuthFailure = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call API to revoke token on server, but with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await revokeToken();
      
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Failed to revoke token:', error);
    } finally {
      // Clear local storage and state regardless of API result
      handleAuthFailure();
      setIsLoading(false);
      setLoginAttempted(true);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      try {
        await checkTokenValidity();
      } catch (error) {
        console.error('Authentication check failed:', error);
        handleAuthFailure();
      } finally {
        setIsLoading(false);
        setLoginAttempted(true);
      }
    };
    
    checkAuthentication();
  }, [checkTokenValidity]);

  const setJustLoggedInFlag = useCallback(() => {
    setJustLoggedIn(true);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    loginAttempted,
    user,
    logout,
    refreshAuth: refreshAuthToken,
    setJustLoggedIn: setJustLoggedInFlag
  };
};

export default useAuth; 