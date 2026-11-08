import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { theme } from './Theme';
import { useReservations, useGuards, useLots, useDrivers /*, useDriverLocations or driver-presence hook */ } from './useLiveData';
import { exportRevenueCsv } from './exportCsv';
// import { useAuth } from './useAuth'; // <-- adjust to wherever the admin's email actually comes from

const glassPanelStyle = {
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
};

function buildSeries(reservations) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), total: 0 });
  }
  reservations.forEach((r) => {
    if (!r.createdAt?.toDate) return;
    if (r.status === 'cancelled') return; // don't count cancelled bookings as revenue
    const rDate = r.createdAt.toDate();
    const bucket = days.find(
      (d) => d.date.getFullYear() === rDate.getFullYear() && d.date.getMonth() === rDate.getMonth() && d.date.getDate() === rDate.getDate(),
    );
    if (bucket) bucket.total += Math.abs(Number(r.amount) || 0);
  });
  return days;
}

export default function Revenuechart({ collapsed, onToggle }) {
  const { rows: reservations } = useReservations();
  const { rows: guards } = useGuards();
  const { rows: lots } = useLots();
  const { rows: drivers } = useDrivers();
  // const { user } = useAuth(); // <-- adjust to your actual auth hook

  const data = buildSeries(reservations);
  const todayTotal = data[data.length - 1]?.total ?? 0;
  const fourteenDayTotal = data.reduce((s, d) => s + d.total, 0);

  const guardsOnline = guards.filter((g) => {
    const lot = lots.find((l) => l.id === g.lotId);
    return Boolean(lot?.isOnline);
  }).length;
  const guardsTotal = guards.length;

  // TODO: replace with real "active" logic once I see how the Drivers panel computes it
  const driversActive = 0;
  const driversTotal = drivers.length;

  const handleExport = async () => {
    await exportRevenueCsv(
      reservations,
      'parkiti-revenue.xlsx',
      /* generatedBy */ 'Admin', // TODO: swap in user?.email once useAuth is wired in
      {
        guardsOnline,
        guardsTotal,
        driversActive,
        driversTotal,
      },
    );
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        style={{
          height: 36,
          width: '100%',
          ...glassPanelStyle,
          borderRadius: 18,
          border: 'none',
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.body,
          ...theme.type.caption,
          letterSpacing: 1,
        }}
      >
        ▲ SHOW REVENUE
      </button>
    );
  }

  return (
    <div
      style={{
        height: 220,
        flexShrink: 0,
        ...glassPanelStyle,
        padding: `${theme.space.md}px ${theme.space.xl}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space.sm }}>
        <div>
          <div style={{ fontFamily: theme.fonts.display, ...theme.type.headline, color: theme.colors.textPrimary }}>
            Revenue — last 14 days
          </div>
          <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 }}>
            <span style={{ color: theme.colors.accent, fontWeight: 600 }}>{todayTotal.toFixed(0)} MAD</span> today ·{' '}
            {fourteenDayTotal.toFixed(0)} MAD total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExport}
            style={{
              fontFamily: theme.fonts.body,
              ...theme.type.caption,
              color: theme.colors.textSecondary,
              background: 'transparent',
              border: `1px solid ${theme.colors.borderStrong}`,
              borderRadius: theme.radius.pill,
              padding: '5px 12px',
            }}
          >
            Export CSV
          </button>
          <button
            onClick={onToggle}
            style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.unreserved, background: 'none', border: 'none' }}
          >
            Hide ▼
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.colors.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.colors.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.colors.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: theme.colors.textMuted, fontSize: 10 }} axisLine={{ stroke: theme.colors.border }} tickLine={false} interval={2} />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: theme.colors.bgPanelSolid, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: theme.colors.textSecondary }}
              formatter={(v) => [`${v.toFixed(0)} MAD`, 'Revenue']}
            />
            <Area type="monotone" dataKey="total" stroke={theme.colors.accent} strokeWidth={2} fill="url(#revFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}