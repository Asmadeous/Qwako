import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import AccountNav from '../components/ui/AccountNav';
import AddressLink from '../components/ui/AddressLink';
import BookingDates from '../components/ui/BookingDates';
import PlaceGallery from '../components/ui/PlaceGallery';
import Spinner from '../components/ui/Spinner';
import { api } from '../utils/axios';
import { formatPrice } from '@/utils/currency';

const SingleBookedPlace = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data.booking))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  return (
    <div>
      <AccountNav />
      {booking ? (
        <div className="p-4">
          <h1 className="text-3xl">{booking.listing.title}</h1>

          <AddressLink className="my-2 block" placeAddress={booking.listing.address} />
          <div className="my-6 flex flex-col items-center justify-between rounded-2xl bg-gray-200 p-6 sm:flex-row">
            <div>
              <h2 className="mb-4 text-2xl md:text-2xl">Your booking information</h2>
              <BookingDates booking={booking} />
              <p className="mt-2 text-gray-700">
                {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'} · Status:{' '}
                {booking.status.replaceAll('_', ' ')}
              </p>
            </div>
            <div className="mt-5 w-full rounded-2xl bg-primary p-6 text-white sm:mt-0 sm:w-auto">
              <div className="hidden md:block">Total price</div>
              <div className="flex justify-center text-3xl">
                <span>{formatPrice(booking.total_pence)}</span>
              </div>
              <div className="text-sm opacity-90">
                {booking.nights} x {formatPrice(booking.nightly_price_pence)}
                {booking.cleaning_charge_pence > 0 &&
                  ` + ${formatPrice(booking.cleaning_charge_pence)} cleaning`}
              </div>
            </div>
          </div>
          <PlaceGallery place={booking.listing} />
        </div>
      ) : (
        <p role="alert" className="p-4 text-center">
          We couldn't find that booking.
        </p>
      )}
    </div>
  );
};

export default SingleBookedPlace;
