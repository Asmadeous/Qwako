import { useMemo } from 'react';

import { AreasMap } from '@/components/ui/HomeMap';
import { usePlaces } from '../../../hooks';
import Section from './Section';

// Where the homes are, for every home the owner has put a pin on.
const Location = () => {
  const { places } = usePlaces();
  const homes = useMemo(() => places.filter((home) => home.map_area), [places]);
  if (homes.length === 0) return null;

  return (
    <Section id="location" title="Where the homes are" className="bg-paper">
      <AreasMap homes={homes} />
      <p className="mt-4 text-sm text-ink/60">
        Each circle is the area around a home. The exact spot and directions are on your booking page once your stay is confirmed.
      </p>
    </Section>
  );
};

export default Location;
