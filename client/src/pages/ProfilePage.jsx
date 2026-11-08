import React from 'react';
import { toast } from 'react-toastify';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import PlacesPage from './PlacesPage';
import { useAuth } from '../../hooks';
import { LogOut } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import EditProfileDialog from '@/components/ui/EditProfileDialog';

const ProfilePage = () => {
  const auth = useAuth();
  const { user, logout } = auth;
  const navigate = useNavigate();

  let { subpage } = useParams();
  if (!subpage) {
    subpage = 'profile';
  }

  const handleLogout = async () => {
    // Leave the account pages first, so signing out doesn't bounce to sign-in.
    navigate('/', { replace: true });
    const response = await logout();
    if (response.success) toast.success(response.message);
    else toast.error(response.message);
  };

  if (auth.loading) {
    return <Spinner />;
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <AccountNav />
      {subpage === 'profile' && (
        <section className="mx-4 grid gap-10 rounded-3xl border border-ink/20 p-6 md:grid-cols-[auto_1fr] md:p-10">
          <Avatar className="h-40 w-40 md:h-56 md:w-56">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" className="object-cover" />}
            <AvatarFallback className="bg-ink font-bold tracking-tight text-7xl text-sand md:text-8xl">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col justify-between gap-8">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-ink/60">Name</dt>
                <dd className="mt-2 font-bold tracking-tight text-3xl">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-ink/60">Email</dt>
                <dd className="mt-2 break-all font-bold tracking-tight text-3xl">{user.email}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <EditProfileDialog />
              <Button variant="outline" onClick={handleLogout} className="rounded-full border-ink bg-transparent text-ink hover:bg-ink/5">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </section>
      )}
      {subpage === 'places' && <PlacesPage />}
    </div>
  );
};

export default ProfilePage;
