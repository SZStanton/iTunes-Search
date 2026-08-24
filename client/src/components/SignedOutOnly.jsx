import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// The other side of ProtectedRoute. A bookmarked /login would otherwise
// strand someone already signed in.
function SignedOutOnly({ children }) {
  const { signedIn, checking } = useAuth();

  if (checking) {
    return (
      <p className="p-16 text-center text-muted">Checking your session...</p>
    );
  }

  if (signedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SignedOutOnly;
