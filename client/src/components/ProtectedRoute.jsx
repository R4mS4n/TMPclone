import { useLocation, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isAuthenticated, isLoading, children }) => {
  const location = useLocation();
  
  if (isLoading) {
    // Show loading state while checking auth
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Only redirect if we're certain the user isn't authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
