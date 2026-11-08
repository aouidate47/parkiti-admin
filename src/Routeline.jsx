import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { theme } from './Theme';

export default function RouteLine({ from, to, reserved }) {
  const [routeCoords, setRouteCoords] = useState(null);

  const validFrom = from && typeof from.lat === 'number' && typeof from.lng === 'number';
  const validTo = to && typeof to.lat === 'number' && typeof to.lng === 'number';

  useEffect(() => {
    if (!validFrom || !validTo) {
      setRouteCoords(null);
      return;
    }

    let cancelled = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (coords) {
          setRouteCoords(coords.map(([lng, lat]) => [lat, lng]));
        } else {
          setRouteCoords(null);
        }
      })
      .catch(() => {
        if (!cancelled) setRouteCoords(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validFrom, validTo, from?.lat, from?.lng, to?.lat, to?.lng]);

  if (!routeCoords) return null;

  const color = reserved ? theme.colors.reserved : theme.colors.unreserved;

  return (
    <>
      <Polyline positions={routeCoords} pathOptions={{ color: '#0B0E12', weight: 6, opacity: 0.5 }} />
      <Polyline positions={routeCoords} pathOptions={{ color, weight: 3, opacity: 0.95 }} />
    </>
  );
}