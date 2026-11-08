import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { theme } from './Theme';

export default function Lotdetailpanel({ lot, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!lot) return null;

  const total = lot.capacity ?? lot.spotsTotal ?? 0;
  const free = lot.available ?? lot.spotsFree ?? 0;
  const taken = total - free;
  const isSuspended = lot.status === 'suspended';

  async function toggleStatus() {
    setBusy(true);
    setError('');
    try {
      const setLotStatus = httpsCallable(functions, 'setLotStatus');
      await setLotStatus({ lotId: lot.id, status: isSuspended ? 'active' : 'suspended' });
    } catch (err) {
      setError(err.message || 'Could not update lot status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          maxWidth: 'calc(100vw - 32px)',
          background: theme.colors.bgPanelSolid,
          border: theme.glass.border,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          borderRadius: theme.radius.md,
          padding: theme.space.lg,
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space.md }}>
        <div>
          <div style={{ fontFamily: theme.fonts.display, ...theme.type.headline, color: theme.colors.textPrimary }}>
            {lot.name}
          </div>
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 }}>
            {lot.zone || '—'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: theme.colors.textMuted, fontSize: 16, lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: theme.space.md }}>
        <MiniStat label="Total" value={total || '—'} />
        <MiniStat label="Free" value={free ?? '—'} color={theme.colors.success} />
        <MiniStat label="Taken" value={Number.isFinite(taken) ? taken : '—'} color={theme.colors.danger} />
      </div>

      <div
        style={{
          fontFamily: theme.fonts.body,
          ...theme.type.caption,
          color: theme.colors.textSecondary,
          marginBottom: theme.space.md,
        }}
      >
        Guard: {lot.guardName || 'Unassigned'}
        {lot.pricing && (
          <>
            <br />
            Price: {lot.pricing.pricePerHour} MAD/h · {lot.pricing.dayPrice} MAD/day
          </>
        )}
        <br />
        Status:{' '}
        <span style={{ color: isSuspended ? theme.colors.warning : theme.colors.success, fontWeight: 600 }}>
          {isSuspended ? 'Suspended' : 'Active'}
        </span>
      </div>

      {error && (
        <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.danger, marginBottom: theme.space.sm }}>
          {error}
        </div>
      )}

      <button
        onClick={toggleStatus}
        disabled={busy}
        style={{
          width: '100%',
          background: isSuspended ? theme.colors.accent : 'transparent',
          color: isSuspended ? '#0B0E12' : theme.colors.danger,
          border: `1px solid ${isSuspended ? theme.colors.accent : theme.colors.danger}`,
          borderRadius: theme.radius.sm,
          padding: '9px',
          fontFamily: theme.fonts.body,
          ...theme.type.subheadline,
          fontWeight: 600,
          opacity: busy ? 0.6 : 1,
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Updating…' : isSuspended ? 'Re-enable lot' : 'Suspend lot'}
      </button>
      <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, marginTop: 6 }}>
        Routed through a Cloud Function — every change is logged with your account and a timestamp.
      </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: theme.colors.bgPanelAlt, borderRadius: theme.radius.sm, padding: '8px 6px', textAlign: 'center' }}>
      <div style={{ fontFamily: theme.fonts.display, ...theme.type.headline, color: color || theme.colors.textPrimary }}>{value}</div>
      <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}