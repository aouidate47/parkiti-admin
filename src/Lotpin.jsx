import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { theme } from './Theme';
import parkitiPin from '../logo/parkiti_pin_logo.png';

function buildLotIcon(lot) {
  const taken = lot.spotsTotal - lot.spotsFree;
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;font-family:${theme.fonts.body};">
      <div style="
        display:flex; gap:8px; background:rgba(28,28,30,0.78);
        backdrop-filter: blur(14px) saturate(180%); -webkit-backdrop-filter: blur(14px) saturate(180%);
        border:1px solid rgba(255,255,255,0.14); border-radius:${theme.radius.pill};
        padding:4px 10px; margin-bottom:4px; white-space:nowrap;
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
      ">
        <span style="color:rgba(235,235,245,0.6);font-size:11px;font-weight:600;">${lot.spotsTotal}</span>
        <span style="color:${theme.colors.success};font-size:11px;font-weight:600;">${lot.spotsFree}</span>
        <span style="color:${theme.colors.danger};font-size:11px;font-weight:600;">${taken}</span>
      </div>
      <img src="${parkitiPin}" style="width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />
    </div>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [64, 74],
    iconAnchor: [32, 74],
  });
}

export default function Lotpin({ lot, onClick }) {
  const taken = lot.spotsTotal - lot.spotsFree;
  return (
    <Marker
      position={[lot.lat, lot.lng]}
      icon={buildLotIcon(lot)}
      eventHandlers={{ click: () => onClick && onClick(lot) }}
    >
      <Popup>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 14, fontWeight: 600 }}>
          {lot.name}
          <div style={{ marginTop: 4, fontFamily: theme.fonts.body, fontSize: 12, fontWeight: 500, color: '#666' }}>
            Total {lot.spotsTotal} · Free {lot.spotsFree} · Taken {taken}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}