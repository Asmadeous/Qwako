import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Maps of a home: free OpenStreetMap tiles drawn with Leaflet. Directions open
// in Google Maps, which starts turn-by-turn navigation on a phone.

const KENYA = [0.2, 37.9];
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// About a kilometre: the public map shows a circle this size around the area.
const AREA_RADIUS_METRES = 1000;

export const directionsUrl = ({ latitude, longitude }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

const toPoint = ({ lat, lng }) => ({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });

const pinIcon = () =>
  L.divIcon({
    className: '',
    html: '<span class="block size-6 rounded-full border-[3px] border-white bg-ink shadow-md"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Creates the Leaflet map once and removes it when the component goes.
const useMap = (containerRef, center, zoom) => {
  const [map, setMap] = useState(null);
  useEffect(() => {
    const created = L.map(containerRef.current, { center, zoom, scrollWheelZoom: false });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(created);
    setMap(created);
    return () => {
      created.remove();
      setMap(null);
    };
    // The map is set up once; later moves go through the map itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return map;
};

const mapClass = 'isolate z-0 w-full overflow-hidden rounded-2xl border border-ink/15';

// Owner: search for a place, then click the map or drag the pin to the home's gate.
export const LocationPicker = ({ value, onChange, error }) => {
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const map = useMap(containerRef, value ? [value.latitude, value.longitude] : KENYA, value ? 16 : 6);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!map) return undefined;
    const place = (e) => onChangeRef.current(toPoint(e.latlng));
    map.on('click', place);
    return () => map.off('click', place);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const at = [value.latitude, value.longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(at);
      return;
    }
    markerRef.current = L.marker(at, { draggable: true, icon: pinIcon(), keyboard: true, title: 'Home location' })
      .on('dragend', (e) => onChangeRef.current(toPoint(e.target.getLatLng())))
      .addTo(map);
  }, [map, value]);

  const search = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchError('');
    setResults(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ke&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('search failed');
      setResults(await response.json());
    } catch {
      setSearchError('We could not search the map just now. Click the map instead, or try again.');
    } finally {
      setSearching(false);
    }
  };

  const choose = (result) => {
    const point = { latitude: Number(Number(result.lat).toFixed(6)), longitude: Number(Number(result.lon).toFixed(6)) };
    map?.setView([point.latitude, point.longitude], 17);
    onChange(point);
    setResults(null);
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <label htmlFor="location-search" className="sr-only">
          Search the map
        </label>
        <input
          id="location-search"
          type="search"
          value={query}
          placeholder="Search a place, for example Tatu City"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" onClick={search} disabled={searching}>
          <Search aria-hidden className="size-4" />
          {searching ? 'Searching...' : 'Find'}
        </Button>
      </div>
      {searchError && <p className="text-sm text-red-700">{searchError}</p>}
      {results && (
        <ul className="grid gap-1 rounded-xl border border-ink/15 bg-paper p-1 text-sm">
          {results.length === 0 && <li className="p-2 text-ink/60">Nothing found. Try a nearby town or landmark.</li>}
          {results.map((result) => (
            <li key={result.place_id}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="w-full rounded-lg p-2 text-left hover:bg-ink/5 focus-visible:bg-ink/5"
              >
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        ref={containerRef}
        aria-label="Map: click to place the pin, then drag it to the exact spot"
        className={cn(mapClass, 'h-80', error && 'border-red-700')}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/70">
        <p className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden strokeWidth={1.5} className="size-4" />
          {value ? (
            <span className="tabular">
              Pin at {value.latitude}, {value.longitude}
            </span>
          ) : (
            'No pin yet. Click the map where the home is.'
          )}
        </p>
        {value && (
          <Button type="button" variant="outline" onClick={() => onChange(null)}>
            <X aria-hidden className="size-4" />
            Remove pin
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
};

// Everyone: the area around the home, not the exact spot.
export const AreaMap = ({ area }) => {
  const containerRef = useRef(null);
  const map = useMap(containerRef, [area.latitude, area.longitude], 13);

  useEffect(() => {
    if (!map) return undefined;
    const circle = L.circle([area.latitude, area.longitude], {
      radius: AREA_RADIUS_METRES,
      className: 'stroke-ink fill-ink',
      weight: 1.5,
      fillOpacity: 0.12,
    }).addTo(map);
    return () => circle.remove();
  }, [map, area.latitude, area.longitude]);

  return (
    <div>
      <div ref={containerRef} aria-label="Map of the area around the home" className={cn(mapClass, 'h-72')} />
      <p className="mt-3 text-sm text-ink/60">
        The home is inside the circle. The exact spot and directions are shared once your booking is confirmed.
      </p>
    </div>
  );
};

// Confirmed guests: the exact pin and directions from wherever they are.
export const PinMap = ({ location }) => {
  const containerRef = useRef(null);
  const map = useMap(containerRef, [location.latitude, location.longitude], 15);

  useEffect(() => {
    if (!map) return undefined;
    const marker = L.marker([location.latitude, location.longitude], { icon: pinIcon(), title: 'The home' }).addTo(map);
    return () => marker.remove();
  }, [map, location.latitude, location.longitude]);

  return (
    <div className="grid gap-3">
      <div ref={containerRef} aria-label="Map showing where the home is" className={cn(mapClass, 'h-72')} />
      <div>
        <a
          href={directionsUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          <Navigation aria-hidden className="size-4" />
          Get directions
          <span className="sr-only"> (opens Google Maps in a new tab)</span>
        </a>
        <p className="mt-2 text-sm text-ink/60">Opens Google Maps with turn-by-turn directions from where you are.</p>
      </div>
    </div>
  );
};

// Home page: the area around every home that has a pin, each named.
export const AreasMap = ({ homes }) => {
  const containerRef = useRef(null);
  const first = homes[0].map_area;
  const map = useMap(containerRef, [first.latitude, first.longitude], 11);

  useEffect(() => {
    if (!map) return undefined;
    const layers = homes.map(({ title, map_area: area }) =>
      L.circle([area.latitude, area.longitude], { radius: AREA_RADIUS_METRES, className: 'stroke-ink fill-ink', weight: 1.5, fillOpacity: 0.12 })
        .bindTooltip(title, { permanent: true, direction: 'top', offset: [0, -8] })
        .addTo(map),
    );
    if (homes.length > 1) map.fitBounds(L.featureGroup(layers).getBounds(), { padding: [48, 48] });
    return () => layers.forEach((layer) => layer.remove());
  }, [map, homes]);

  return <div ref={containerRef} aria-label="Map of where the homes are" className={cn(mapClass, 'h-96')} />;
};
