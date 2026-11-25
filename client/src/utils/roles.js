// Who is signed in, for showing the right dashboard. The API checks again.
// admin is the owner (everything); staff run bookings, calendar, guests and messages.
export const isOwner = (user) => user?.role === 'admin';
export const isTeam = (user) => user?.role === 'admin' || user?.role === 'staff';
