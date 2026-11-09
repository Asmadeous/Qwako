import { Navigate, Routes, Route } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/ui/Layout';
import RequireSignIn from './components/ui/RequireSignIn';
import IndexPage from './pages/IndexPage';
import HomePage from './pages/home/HomePage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PlacesPage from './pages/PlacesPage';
import BookingsPage from './pages/BookingsPage';
import PlacesFormPage from './pages/PlacesFormPage';
import PlacePage from './pages/PlacePage';
import SingleBookedPlace from './pages/SingleBookedPlace';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import OwnerBookingPage from './pages/OwnerBookingPage';
import { UserProvider } from './providers/UserProvider';
import { PlaceProvider } from './providers/PlaceProvider';
import NotFoundPage from './pages/NotFoundPage';

// Toast icons in the site's colours instead of the library's green and red.
const toastIcon = ({ type }) => {
  if (type === 'error') return <AlertCircle aria-hidden strokeWidth={2} className="size-5 text-[#F2B8B5]" />;
  if (type === 'success') return <CheckCircle2 aria-hidden strokeWidth={2} className="size-5 text-sand" />;
  return <Info aria-hidden strokeWidth={2} className="size-5 text-sand" />;
};

function App() {
  return (
    <>
      <UserProvider>
        <PlaceProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<Layout />}>
              <Route path="/homes" element={<IndexPage />} />
              <Route path="/stays" element={<Navigate to="/homes" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/place/:id" element={<PlacePage />} />
              <Route element={<RequireSignIn />}>
                <Route path="/account" element={<ProfilePage />} />
                <Route path="/account/places" element={<PlacesPage />} />
                <Route path="/account/places/new" element={<PlacesFormPage />} />
                <Route path="/account/places/:id" element={<PlacesFormPage />} />
                <Route path="/account/bookings" element={<BookingsPage />} />
                <Route path="/account/bookings/:id" element={<SingleBookedPlace />} />
                <Route path="/account/reservations" element={<OwnerBookingsPage />} />
                <Route path="/account/reservations/:id" element={<OwnerBookingPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <ToastContainer
            position="bottom-center"
            autoClose={3000}
            hideProgressBar
            closeOnClick
            transition={Slide}
            icon={toastIcon}
          />
        </PlaceProvider>
      </UserProvider>
    </>
  );
}

export default App;
