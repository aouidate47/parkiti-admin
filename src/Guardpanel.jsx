import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from './Theme';
import StatCard from './statcard';
import { useGuards, useLots, useGuardPresence } from './useLiveData';
import { useLang } from './i18n';

const FILTERS = ['all', 'online', 'offline'];
const APP_STALE_AFTER_MS = 2 * 60 * 1000; // 2x the 60s heartbeat interval

function formatLastSeen(lastSeenMillis, t) {
  if (!lastSeenMillis) return t('lsNever');
  const diffSec = Math.max(0, Math.floor((Date.now() - lastSeenMillis) / 1000));
  if (diffSec < 60) return t('lsActive', { n: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('lsMin', { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('lsHr', { n: diffHr });
  return t('lsDay', { n: Math.floor(diffHr / 24) });
}

function PhoneIcon({ active, lastSeenMillis }) {
  const { t } = useLang();
  const label = formatLastSeen(lastSeenMillis, t);

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <rect
          x="6.5" y="2" width="11" height="20" rx="2.5"
          stroke={active ? theme.colors.success : theme.colors.textMuted}
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="12" cy="18.5" r="1.1"
          fill={active ? theme.colors.success : theme.colors.textMuted}
        />
      </svg>
      <span
        style={{
          fontFamily: theme.fonts.body,
          ...theme.type.caption,
          color: theme.colors.success,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </span>
  );
}

export default function GuardPanel({ collapsed, onToggle }) {
  const { rows: guards, loading } = useGuards();
  const { t } = useLang();
  const { rows: lots } = useLots();
  const { rows: presence } = useGuardPresence();
  const [filter, setFilter] = useState('all');

  // Guards don't carry their own online/offline flag — we infer it from
  // whether their assigned lot (via guard.lotId) is currently isOnline.
  // Separately, "appActive" reflects whether the guard's phone actually
  // has the app open right now, via the guardPresence heartbeat.
  const enriched = useMemo(
    () =>
      guards.map((g) => {
        const lot = lots.find((l) => l.id === g.lotId);
        const p = presence.find((row) => row.id === g.id);
        const lastSeenMillis = p?.lastSeen?.toMillis?.() ?? null;
        const appActive = Boolean(lastSeenMillis) && Date.now() - lastSeenMillis < APP_STALE_AFTER_MS;
        return {
          ...g,
          lot,
          online: Boolean(lot?.isOnline),
          appActive,
          lastSeenMillis,
        };
      }),
    [guards, lots, presence],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return enriched;
    return enriched.filter((g) => (filter === 'online' ? g.online : !g.online));
  }, [enriched, filter]);

  const uniqueLots = useMemo(() => {
    const map = new Map();
    enriched.forEach((g) => {
      if (g.lot) map.set(g.lot.id, g.lot);
    });
    return [...map.values()];
  }, [enriched]);

  const totalCapacity = uniqueLots.reduce((s, l) => s + (l.capacity || 0), 0);
  const totalAvailable = uniqueLots.reduce((s, l) => s + (l.available || 0), 0);
  const online = enriched.filter((g) => g.online).length;

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
        GUARDS
      </button>
    );
  }

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
        <h2 style={{ fontFamily: theme.fonts.display, ...theme.type.title2, color: theme.colors.textPrimary, margin: 0 }}>
          Guards
        </h2>
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', color: theme.colors.unreserved, fontFamily: theme.fonts.body, ...theme.type.subheadline }}
        >
          ‹ Hide
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.space.sm, padding: `0 ${theme.space.xl}px ${theme.space.lg}px` }}>
        <StatCard label="Guards online" value={`${online}/${enriched.length}`} accent />
        <StatCard label="Free / total spots" value={`${totalAvailable}/${totalCapacity}`} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: `0 ${theme.space.xl}px ${theme.space.md}px` }}>
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
        {filtered.length} guard{filtered.length === 1 ? '' : 's'}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${theme.space.md}px ${theme.space.md}px` }}>
        {loading && (
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textMuted, padding: theme.space.md }}>
            Loading guards…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textMuted, padding: theme.space.md }}>
            No guards match this filter.
          </div>
        )}
        {filtered.map((g) => (
          <Link
            key={g.id}
            to={`/guard/${g.id}`}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.sm }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: g.online ? theme.colors.success : theme.colors.textMuted,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: theme.fonts.body, ...theme.type.headline, color: theme.colors.textPrimary }}>{g.name}</span>
              </div>
              <PhoneIcon active={g.appActive} lastSeenMillis={g.lastSeenMillis} />
            </div>
            <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 2, marginLeft: 15 }}>
              {g.lot?.zone || g.lot?.name || 'Unassigned'}
            </div>
            <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, marginTop: 3, marginLeft: 15 }}>
              {g.lot ? t('gdFree', { a: g.lot.available, c: g.lot.capacity }) : t('gpNoLot')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}