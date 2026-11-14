import { Navigate, Routes, Route } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/ui/Layout';
import RequireSignIn from './components/ui/RequireSignIn';
import DashboardLayout from './components/ui/DashboardLayout';
import AccountHome from './pages/AccountHome';
import FinancesPage from './pages/FinancesPage';
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
import { SavedProvider } from './providers/SavedProvider';
import NotFoundPage from './pages/NotFoundPage';
import ReceiptPage from './pages/ReceiptPage';
import SavedPage from './pages/SavedPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import InboxPage from './pages/InboxPage';
import GuestsPage from './pages/GuestsPage';
import ReviewsPage from './pages/ReviewsPage';
import TeamPage from './pages/TeamPage';
import ActivityPage from './pages/ActivityPage';
import RequireOwner from './components/ui/RequireOwner';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import ContactPage from './pages/ContactPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CookieNotice from './components/ui/CookieNotice';
import { NotificationsProvider } from './providers/NotificationsProvider';

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
          <SavedProvider>
          <NotificationsProvider>
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
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route element={<RequireSignIn />}>
                <Route element={<DashboardLayout />}>
                <Route path="/account" element={<AccountHome />} />
                <Route path="/account/profile" element={<ProfilePage />} />
                <Route path="/account/settings" element={<SettingsPage />} />
                <Route path="/account/notifications" element={<NotificationsPage />} />
                <Route path="/account/bookings" element={<BookingsPage />} />
                <Route path="/account/bookings/:id" element={<SingleBookedPlace />} />
                <Route path="/account/bookings/:id/receipt" element={<ReceiptPage />} />
                <Route path="/account/saved" element={<SavedPage />} />
                <Route path="/account/messages" element={<MessagesPage />} />
                <Route path="/account/messages/:id" element={<MessagesPage />} />
                <Route element={<RequireOwner />}>
                  <Route path="/account/finances" element={<FinancesPage />} />
                  <Route path="/account/places" element={<PlacesPage />} />
                  <Route path="/account/places/new" element={<PlacesFormPage />} />
                  <Route path="/account/places/:id" element={<PlacesFormPage />} />
                  <Route path="/account/reservations" element={<OwnerBookingsPage />} />
                  <Route path="/account/reservations/:id" element={<OwnerBookingPage />} />
                  <Route path="/account/calendar" element={<CalendarPage />} />
                  <Route path="/account/inbox" element={<InboxPage />} />
                  <Route path="/account/inbox/:id" element={<InboxPage />} />
                  <Route path="/account/guests" element={<GuestsPage />} />
                  <Route path="/account/guests/:id" element={<GuestsPage />} />
                  <Route path="/account/reviews" element={<ReviewsPage />} />
                  <Route path="/account/team" element={<TeamPage />} />
                  <Route path="/account/activity" element={<ActivityPage />} />
                </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <CookieNotice />
          </NotificationsProvider>
          </SavedProvider>
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
