import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// Sends anyone without a session to the login page. The stored token is checked
// against the server first, so this waits rather than bouncing someone who is
// actually signed in
function ProtectedRoute({ children }) {
  const { signedIn, checking } = useAuth();

  if (checking) {
    return <p className="route-checking">Checking your session...</p>;
  }

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
