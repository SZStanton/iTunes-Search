import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// Send anyone without a session to login, once the token check has finished.
function ProtectedRoute({ children }) {
  const { signedIn, checking, unreachable, retryCheck } = useAuth();

  if (checking) {
    return (
      <p className="p-16 text-center text-muted">Checking your session...</p>
    );
  }

  // Unverified, not rejected. The server is probably just waking up.
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
          className="accent-fill rounded-full px-5 py-2 font-medium transition hover:brightness-110 active:translate-y-px active:brightness-95"
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
