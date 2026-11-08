// ------------- // Carmarker.jsx
 
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { theme } from './Theme';

function buildCarIcon(car) {
  const color = car.reserved ? theme.colors.reserved : theme.colors.unreserved;
  const html = `
    <div style="
      width:16px;height:16px;border-radius:50%;
      background:${color}; border:2px solid #0B0E12;
      box-shadow:0 0 0 3px ${color}33;
      transform:rotate(${car.heading || 0}deg);
    "></div>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function Carmarker({ car }) {
  return (
    <Marker position={[car.lat, car.lng]} icon={buildCarIcon(car)}>
      <Popup>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 13 }}>
          <strong>{car.driverName}</strong>
          <div style={{ marginTop: 4, fontSize: 12, color: car.reserved ? theme.colors.reserved : theme.colors.unreserved }}>
            {car.reserved ? `Driving to reserved spot · ${car.lotName}` : 'Navigating (no reservation)'}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
