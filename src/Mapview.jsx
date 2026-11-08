// ---------------- // Mapview.jsx

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Heatmaplayer from './Heatmaplayer';
import Lotpin from './Lotpin';
import Carmarker from './Carmarker';
import Lotdetailpanel from './Lotdetailpanel';
import { theme } from './Theme';
import { useLots, useReservations, useGuards, useDriverLocations } from './useLiveData';
import RouteLine from './Routeline';

const MARRAKECH_CENTER = [31.6295, -7.9811];
const STALE_AFTER_MS = 3 * 60 * 1000; // ignore a location doc that hasn't updated in 3 min

// Leaflet sometimes computes a 0x0 container size on first mount if the
// parent layout (flex/grid) hasn't settled yet. Nudging invalidateSize()
// on mount forces Leaflet to recheck real dimensions once the DOM is ready.
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

export default function Mapview() {
  const { rows: lots } = useLots();
  const { rows: reservations } = useReservations();
  const { rows: guards } = useGuards();
  const { rows: driverLocations } = useDriverLocations();

  // Quick lookup so we can find a car's destination lot coords by lotId
  const lotById = Object.fromEntries(
    lots
      .filter((lot) => typeof lot.latitude === 'number' && typeof lot.longitude === 'number')
      .map((lot) => [lot.id, { lat: lot.latitude, lng: lot.longitude }])
  );
  const cars = driverLocations
    .filter(
      (d) =>
        typeof d.lat === 'number' &&
        typeof d.lng === 'number' &&
        (d.status === 'navigating' || d.status === 'reservation') &&
        Date.now() - (d.updatedAt?.toMillis?.() ?? 0) < STALE_AFTER_MS
    )
    .map((d) => ({ ...d, destination: lotById[d.lotId] || null }));

  console.log('cars with destinations:', cars.map(c => ({ id: c.id, lotId: c.lotId, destination: c.destination })));

  const [selectedLot, setSelectedLot] = useState(null);


  // Cars only render once the driver app is actually writing lat/lng onto
  // the reservation (see functions/driver-app-reference/shareLocation.js).
  // Until that ships, this list is simply empty — that's expected, not a bug.
  // const cars = reservations.filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number');

  const lotPins = lots.map((lot) => ({
    ...lot,
    spotsTotal: lot.capacity,
    spotsFree: lot.available,
    guardName: guards.find((g) => g.lotId === lot.id)?.name,
  }));

  const heatPoints = lots
    .filter(
      (lot) =>
        lot.capacity > 0 &&
        typeof lot.latitude === 'number' &&
        typeof lot.longitude === 'number'
    )
    .map((lot) => [lot.latitude, lot.longitude, (lot.capacity - lot.available) / lot.capacity]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={MARRAKECH_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%', background: theme.colors.bg }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <InvalidateOnMount />
        <Heatmaplayer points={heatPoints} />
        {lotPins.map((lot) => (
          <Lotpin
            key={lot.id}
            lot={{ ...lot, lat: lot.latitude, lng: lot.longitude }}
            onClick={setSelectedLot}
          />
        ))}
                {cars.map((car) => (
          <RouteLine
            key={`route-${car.id}`}
            from={{ lat: car.lat, lng: car.lng }}
            to={car.destination}
            reserved={car.status === 'reservation'}
          />
        ))}
      
        {cars.map((car) => (
          <Carmarker
            key={car.id}
            car={{
              lat: car.lat,
              lng: car.lng,
              heading: car.heading || 0,
              reserved: car.status === 'reservation',
              lotName: car.lotName,
              driverName: car.driverName,
            }}
          />
        ))}
      </MapContainer>

      <Lotdetailpanel lot={selectedLot} onClose={() => setSelectedLot(null)} />
    </div>
  );
}