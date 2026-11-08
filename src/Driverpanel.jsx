// ---------------- // Driverpanel.jsx

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from './Theme';
import StatCard from './statcard';
import { useLang } from './i18n';
import { useDrivers, useReservations, useDriverLocations } from './useLiveData';


const STATUS_LABEL = {
  confirmed: 'Reserved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const FILTERS = ['all', 'navigating', 'reserved', 'idle'];
const STALE_AFTER_MS = 3 * 60 * 1000; // matches Mapview's threshold
const ACTIVE_RESERVATION_STATUSES = ['pending', 'paid', 'confirmed', 'awaiting_driver_confirmation'];
const isActiveReservation = (r) =>
  !!r &&
  ACTIVE_RESERVATION_STATUSES.includes(r.status) &&
  (!r.expiresAt || (r.expiresAt?.toMillis?.() ?? r.expiresAt) > Date.now());

export function deriveDisplayStatus(reservation, location) {
    const isLive =
    location &&
    (location.status === 'navigating' || location.status === 'reservation') &&
    Date.now() - (location.updatedAt?.toMillis?.() ?? 0) < STALE_AFTER_MS;
  if (isLive) return 'navigating';
  if (isActiveReservation(reservation)) return 'reserved';
  return 'idle';
}

export default function DriverPanel({ collapsed, onToggle }) {
  const { rows: drivers, loading } = useDrivers();
  const { rows: reservations } = useReservations();
  const { rows: driverLocations } = useDriverLocations();
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);
     useEffect(() => {
     const id = setInterval(() => setTick((n) => n + 1), 30000);
     return () => clearInterval(id);
     }, []);

const enriched = useMemo(() => {
  return drivers.map((d) => {
    const location = driverLocations.find((l) => l.id === d.id);
    const linked = location?.reservationId
      ? reservations.find((r) => r.id === location.reservationId)
      : null;
    const latest =
      linked ??
      reservations
        .filter((r) => r.driverId === d.id)
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))[0];

    const displayStatus = deriveDisplayStatus(latest, location);
    const liveReservation = location?.status === 'reservation' && displayStatus === 'navigating';

    return {
      ...d,
      location,
      reservation: latest,
      hasActiveReservation: isActiveReservation(latest) || liveReservation,
      displayStatus,
    };
  });
}, [drivers, reservations, driverLocations, tick]);
  

  const filtered = useMemo(
    () => (filter === 'all' ? enriched : enriched.filter((d) => d.displayStatus === filter)),
    [enriched, filter],
  );

  if (collapsed) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 36,
        height: 'calc(100% - 32px)',
        margin: 16,
        background: `
          linear-gradient(
            135deg,
            rgba(20, 20, 24, 0.85),
            rgba(10, 10, 12, 0.9) 40%,
            rgba(0, 0, 0, 0.92)
          )
        `,
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderRadius: 18,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          0 12px 40px rgba(0, 0, 0, 0.45),
          inset 0 1px 0 rgba(255, 255, 255, 0.06)
        `,
        color: theme.colors.textSecondary,
        writingMode: 'vertical-rl',
        fontFamily: theme.fonts.body,
        ...theme.type.caption,
        letterSpacing: 1,
      }}
    >
      DRIVERS
    </button>
  );
}

  const activeNow = enriched.filter((d) => d.displayStatus !== 'idle').length;

  return (
   <div
  style={{
    width: 320,
    height: 'calc(100% - 32px)',
    margin: 16,

    display: 'flex',
    flexDirection: 'column',

    background: `
  linear-gradient(
    135deg,
    rgba(20, 20, 24, 0.85),
    rgba(10, 10, 12, 0.9) 40%,
    rgba(0, 0, 0, 0.92)
  )
`,

backdropFilter: 'blur(24px) saturate(140%)',
WebkitBackdropFilter: 'blur(24px) saturate(140%)',

borderRadius: 28,

border: '1px solid rgba(255, 255, 255, 0.08)',

boxShadow: `
  0 12px 40px rgba(0, 0, 0, 0.45),
  inset 0 1px 0 rgba(255, 255, 255, 0.06)
`,
    overflow: 'hidden',
  }}
>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${theme.space.xl}px ${theme.space.xl}px ${theme.space.md}px`,
        }}
      >
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', color: theme.colors.unreserved, fontFamily: theme.fonts.body, ...theme.type.subheadline }}
        >
          Hide ›
        </button>
        <h2 style={{ fontFamily: theme.fonts.display, ...theme.type.title2, color: theme.colors.textPrimary, margin: 0 }}>
          Drivers
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.space.sm, padding: `0 ${theme.space.xl}px ${theme.space.lg}px` }}>
        <StatCard label="Total users" value={drivers.length} />
        <StatCard label="Active now" value={activeNow} accent />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: `0 ${theme.space.xl}px ${theme.space.md}px` }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: theme.fonts.body,
              ...theme.type.caption,
              textTransform: 'capitalize',
              color: filter === f ? theme.colors.bg : theme.colors.textSecondary,
              background: filter === f ? theme.colors.accent : 'transparent',
              border: `1px solid ${filter === f ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.radius.pill,
              padding: '4px 11px',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ padding: `0 ${theme.space.xl}px ${theme.space.sm}px`, fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {filtered.length} driver{filtered.length === 1 ? '' : 's'}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${theme.space.md}px ${theme.space.md}px` }}>
        {loading && (
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textMuted, padding: theme.space.md }}>
            Loading drivers…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textMuted, padding: theme.space.md }}>
            No drivers match this filter.
          </div>
        )}
        {filtered.map((d) => (
          <Link
            key={d.id}
            to={`/driver/${d.id}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              padding: `${theme.space.sm}px ${theme.space.sm}px`,
              borderRadius: theme.radius.sm,
              marginBottom: 2,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPanelAlt)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: theme.fonts.body, ...theme.type.headline, color: theme.colors.textPrimary }}>{d.name}</span>
              <span
                style={{
                  fontFamily: theme.fonts.body,
                  ...theme.type.caption,
                  color: d.displayStatus === 'navigating' ? theme.colors.accent : theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.pill,
                  padding: '2px 9px',
                  textTransform: 'capitalize',
                }}
              >
                {d.displayStatus === 'reserved' ? STATUS_LABEL.confirmed : d.displayStatus === 'navigating' ? 'Navigating' : 'Idle'}
              </span>
            </div>
           <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 3 }}>
              {d.hasActiveReservation
              ? (d.reservation?.lotName ?? d.location?.lotName ?? 'Active reservation')
              : 'No active reservation'}
           </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
