import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// points: [ [lat, lng, intensity], ... ]  intensity 0..1
export default function Heatmaplayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Guard against malformed data (missing/NaN lat-lng) which can break
    // leaflet.heat's internal canvas sizing and throw IndexSizeError.
    const validPoints = points.filter(
      (p) =>
        Array.isArray(p) &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1])
    );

    if (validPoints.length === 0) return;

    // If the map container hasn't been sized yet (e.g. parent layout still
    // settling), nudge Leaflet to recalculate before we add the heat layer.
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) {
      map.invalidateSize();
    }

    const heatLayer = L.heatLayer(validPoints, {
      radius: 45,
      blur: 35,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.2: '#3B82F6', // cool / low activity
        0.4: '#4DA3FF',
        0.6: '#FFB020',
        0.8: '#FF7A3D',
        1.0: '#FF4D4D', // hot / high activity
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}