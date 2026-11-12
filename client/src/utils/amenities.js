import { Car, Check, DoorOpen, PawPrint, Radio, Tv, Wifi } from 'lucide-react';

// Icons for the amenities the site started with; ones the owner adds get a tick.
const ICONS = { wifi: Wifi, parking: Car, tv: Tv, radio: Radio, pets: PawPrint, entrance: DoorOpen };

export const amenityIcon = (key) => ICONS[key] ?? Check;
