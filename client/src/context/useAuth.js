import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Its own file so AuthContext.jsx exports nothing but the component, which is
// what react-refresh needs to hot reload it
function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth has to be used inside an AuthProvider');
  }

  return value;
}

export { useAuth };
