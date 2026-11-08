import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../../hooks';
import Spinner from './Spinner';

// Account pages need a signed-in user. Visitors go to sign in, then come back
// to the page they asked for (including Paystack's ?reference= on return).
export default function RequireSignIn() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}
