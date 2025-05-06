import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from '../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, loginAttempted } = useAuthContext();
  
  // If still loading initial auth check and login hasn't been attempted yet, show nothing
  // This prevents premature redirects
  if (isLoading && !loginAttempted) {
    return null;
  }
  
  // If authenticated, redirect to home page or the intended destination
  if (isAuthenticated) {
    // Get the redirect path from location state or default to /home
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }
  
  // Otherwise, show the requested public route
  return children;
};

export default PublicRoute;