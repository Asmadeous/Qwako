import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../../hooks';

// Owner pages: guests are sent to their own overview. The API refuses them too.
export default function RequireOwner() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/account" replace />;
}
