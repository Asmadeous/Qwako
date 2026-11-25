import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../../hooks';
import { isOwner, isTeam } from '@/utils/roles';

// Team pages: guests are sent to their own overview. With `ownerOnly`, staff
// are too. The API refuses them either way.
export default function RequireOwner({ ownerOnly = false }) {
  const { user } = useAuth();
  const allowed = ownerOnly ? isOwner(user) : isTeam(user);
  return allowed ? <Outlet /> : <Navigate to="/account" replace />;
}
