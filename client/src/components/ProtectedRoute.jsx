import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// Sends anyone without a session to the login page. The stored token is checked
// against the server first, so this waits rather than bouncing someone who is
// actually signed in
function ProtectedRoute({ children }) {
  const { signedIn, checking, unreachable, retryCheck } = useAuth();

  if (checking) {
    return <p className="route-checking">Checking your session...</p>;
  }

  // A held token that could not be verified. Sending them to the login page
  // would be wrong, the session is probably fine and the server is just waking
  if (unreachable) {
    return (
      <div className="route-checking" role="alert">
        <p>
          Could not reach the server. The free tier can take a minute to wake.
        </p>
        <button className="btn btn-primary" type="button" onClick={retryCheck}>
          Try again
        </button>
      </div>
    );
  }

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
