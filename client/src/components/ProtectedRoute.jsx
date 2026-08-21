import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// Sends anyone without a session to the login page, waiting on the token check
// rather than bouncing someone who is actually signed in
function ProtectedRoute({ children }) {
  const { signedIn, checking, unreachable, retryCheck } = useAuth();

  if (checking) {
    return (
      <p className="p-16 text-center text-muted">Checking your session...</p>
    );
  }

  // A held token that could not be verified. Sending them to the login page
  // would be wrong, the session is probably fine and the server is just waking
  if (unreachable) {
    return (
      <div
        className="flex flex-col items-center gap-4 p-16 text-center"
        role="alert"
      >
        <p className="text-muted">
          Could not reach the server. The free tier can take a minute to wake.
        </p>
        <button
          className="rounded-full bg-accent-strong px-5 py-2 font-medium text-accent-ink transition hover:brightness-110 active:brightness-95"
          type="button"
          onClick={retryCheck}
        >
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
