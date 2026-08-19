import { Navigate } from 'react-router';
import { useAuth } from '../context/useAuth';

// The other side of ProtectedRoute. Someone already signed in who opens a
// bookmarked /login would otherwise get a form with no way back to the app
function SignedOutOnly({ children }) {
  const { signedIn, checking } = useAuth();

  if (checking) {
    return <p className="route-checking">Checking your session...</p>;
  }

  if (signedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SignedOutOnly;
