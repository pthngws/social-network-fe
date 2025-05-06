import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, loginAttempted } = useAuthContext();
  
  // If still loading initial auth check and login hasn't been attempted yet, show nothing
  // This prevents premature redirects
  if (isLoading && !loginAttempted) {
    return null;
  }
  
  // If not authenticated, redirect to login page and save the current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Otherwise, show the requested private route
  return children;
};

export default PrivateRoute;