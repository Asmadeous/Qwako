import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { api } from '@/utils/axios';
import { useAuth } from '../../hooks';

import AccountNav from '@/components/ui/AccountNav';
import InfoCard from '@/components/ui/InfoCard';
import Spinner from '@/components/ui/Spinner';

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
      .catch(() => setError('We could not load your stays. Please try again.'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (auth.loading) return <Spinner />;
  if (!auth.user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/account" />;
  if (loading) return <Spinner />;

  return (
    <div>
      <AccountNav />
      <div className="text-center ">
        <Link
          className="inline-flex gap-1 rounded-full bg-primary py-2 px-6 text-white"
          to={'/account/places/new'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add a stay
        </Link>
      </div>
      <div className="mx-4 mt-4">
        {error && <p role="alert">{error}</p>}
        {places.map((place) => (
          <InfoCard place={place} key={place.id} />
        ))}
      </div>
    </div>
  );
};

export default PlacesPage;
