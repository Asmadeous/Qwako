import React from 'react';
import { toast } from 'react-toastify';
import { Navigate, useNavigate } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { useAuth } from '../../hooks';
import { LogOut } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import EditProfileDialog from '@/components/ui/EditProfileDialog';

const ProfilePage = () => {
  const auth = useAuth();
  const { user, logout } = auth;
  const navigate = useNavigate();

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
      <section className="mx-4 grid max-w-3xl items-center gap-8 rounded-3xl border border-ink/15 bg-paper p-6 sm:grid-cols-[auto_1fr] md:p-8">
          <Avatar className="size-24 md:size-28">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" className="object-cover" />}
            <AvatarFallback className="bg-ink text-4xl font-bold text-sand">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-ink/60">Name</dt>
                <dd className="mt-1 text-xl font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-ink/60">Email</dt>
                <dd className="mt-1 break-all text-xl font-semibold">{user.email}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <EditProfileDialog />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut aria-hidden className="size-4" />
                Sign out
              </Button>
            </div>
          </div>
        </section>
    </div>
  );
};

export default ProfilePage;
