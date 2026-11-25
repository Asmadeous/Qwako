import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { api } from '@/utils/axios';
import { useAuth } from '../../hooks';

import AccountNav from '@/components/ui/AccountNav';
import InfoCard from '@/components/ui/InfoCard';
import Spinner from '@/components/ui/Spinner';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import usePageParam from '@/utils/usePageParam';
import { buttonVariants } from '@/components/ui/button';

const PlacesPage = () => {
  const [result, setResult] = useState(null);
  const places = result?.listings ?? [];
  const [page, setPage] = usePageParam();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const isAdmin = auth.user?.role === 'admin';

  const loadPlaces = () =>
    api
      .get('/admin/listings', { params: { page } })
      .then(({ data }) => setResult(data))
      .catch(() => setError('We could not load your homes. Please try again.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isAdmin) loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page]);

  if (auth.loading) return <Spinner />;
  if (!auth.user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/account" />;
  if (loading && !result) return <Spinner />;
  const total = result?.total ?? 0;

  return (
    <div>
      <AccountNav
        description={`${total} ${total === 1 ? 'home' : 'homes'}. Open one to edit its details, photos and prices.`}
        actions={
          <Link className={buttonVariants()} to="/account/places/new">
            <Plus aria-hidden className="size-4" />
            Add a home
          </Link>
        }
      />
      <div className="mx-4 grid gap-3">
        {error && <p role="alert">{error}</p>}
        {places.map((place) => (
          <InfoCard place={place} key={place.id} onChange={loadPlaces} />
        ))}
      </div>
      {result && <Pagination {...pageProps(result)} onPage={setPage} label="homes" className="mx-4" />}
      <div className="mb-24" />
    </div>
  );
};

export default PlacesPage;
