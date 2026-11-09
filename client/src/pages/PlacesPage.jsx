import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { api } from '@/utils/axios';
import { useAuth } from '../../hooks';

import AccountNav from '@/components/ui/AccountNav';
import InfoCard from '@/components/ui/InfoCard';
import Spinner from '@/components/ui/Spinner';
import { buttonVariants } from '@/components/ui/button';

const PlacesPage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const isAdmin = auth.user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get('/admin/listings')
      .then(({ data }) => setPlaces(data.listings))
      .catch(() => setError('We could not load your homes. Please try again.'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (auth.loading) return <Spinner />;
  if (!auth.user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/account" />;
  if (loading) return <Spinner />;

  return (
    <div>
      <AccountNav />
      <div className="mx-4 flex items-center justify-between">
        <span className="text-sm text-ink/70">
          {places.length} {places.length === 1 ? 'home' : 'homes'}
        </span>
        <Link className={buttonVariants()} to="/account/places/new">
          Add a home
        </Link>
      </div>
      <div className="mx-4 mt-4 grid gap-3">
        {error && <p role="alert">{error}</p>}
        {places.map((place) => (
          <InfoCard place={place} key={place.id} />
        ))}
      </div>
    </div>
  );
};

export default PlacesPage;
