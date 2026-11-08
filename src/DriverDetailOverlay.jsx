import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { theme } from './Theme';
import { useDrivers, useReservations, useDriverLocations } from './useLiveData';

const STALE_AFTER_MS = 3 * 60 * 1000; // same threshold as DriverPanel / Mapview
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed', 'awaiting_driver_confirmation'];

const isActive = (r) =>
  !!r &&
  ACTIVE_STATUSES.includes(r.status) &&
  (!r.expiresAt || (r.expiresAt?.toMillis?.() ?? r.expiresAt) > Date.now());

const fmtDate = (ts) => {
  const ms = ts?.toMillis?.();
  return ms ? new Date(ms).toLocaleString() : '—';
};

export default function DriverDetailOverlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rows: drivers, loading } = useDrivers();
  const { rows: reservations } = useReservations();
  const { rows: locations } = useDriverLocations();

  const driver = drivers.find((d) => d.id === id);

  const info = useMemo(() => {
    if (!driver) return null;
    const mine = reservations
      .filter((r) => r.driverId === driver.id)
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const location = locations.find((l) => l.id === driver.id);
    const live =
      location &&
      (location.status === 'navigating' || location.status === 'reservation') &&
      Date.now() - (location.updatedAt?.toMillis?.() ?? 0) < STALE_AFTER_MS;
    const latest = mine[0];
    const status = live ? 'Navigating' : isActive(latest) ? 'Reserved' : 'Idle';
    return { latest, status, count: mine.length };
  }, [driver, reservations, locations]);

  return (
    <div
      onClick={() => navigate('/')}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: '90vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(20,20,24,0.95), rgba(0,0,0,0.97) 60%)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          padding: theme.space.xl,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.space.lg }}>
          <h2 style={{ fontFamily: theme.fonts.display, ...theme.type.title2, color: theme.colors.textPrimary, margin: 0 }}>
            {loading ? 'Loading…' : driver?.name || 'Driver not found'}
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: theme.colors.textSecondary, cursor: 'pointer', fontFamily: theme.fonts.body, ...theme.type.subheadline }}
          >
            ✕
          </button>
        </div>

        {!loading && !driver && (
          <p style={{ fontFamily: theme.fonts.body, color: theme.colors.textMuted, ...theme.type.footnote }}>
            No driver found with id "{id}".
          </p>
        )}

        {driver && info && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>
            <Row label="Status" value={info.status} />
            <Row label="Phone" value={driver.phone || '—'} href={driver.phone ? `tel:${driver.phone}` : undefined} />
            <Row label="Email" value={driver.email || '—'} />
            <Row
              label="Wallet"
              value={driver.walletBalance != null ? `${Number(driver.walletBalance).toFixed(2)} MAD` : '—'}
            />
            <Row label="Recent reservations" value={String(info.count)} />

            <div style={{ height: 1, background: theme.colors.border, margin: `${theme.space.sm}px 0` }} />

            <div style={{ fontFamily: theme.fonts.body, ...theme.type.subheadline, color: theme.colors.textPrimary }}>
              Latest reservation
            </div>
            {info.latest ? (
              <>
                <Row label="Parking" value={info.latest.lotName || '—'} />
                <Row label="Status" value={info.latest.status || '—'} />
                <Row label="Amount" value={info.latest.amount != null ? `${info.latest.amount} MAD` : '—'} />
                <Row label="Payment" value={info.latest.paymentMethod || '—'} />
                <Row label="Created" value={fmtDate(info.latest.createdAt)} />
              </>
            ) : (
              <span style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textMuted }}>
                This driver has no reservations yet.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, href }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.space.md, fontFamily: theme.fonts.body, ...theme.type.footnote }}>
      <span style={{ color: theme.colors.textMuted }}>{label}</span>
      {href ? (
        <a
          href={href}
          style={{ color: theme.colors.accent, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {value}
        </a>
      ) : (
        <span style={{ color: theme.colors.textPrimary, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
      )}
    </div>
  );
}