// DashboardLayout.jsx

import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { theme } from './Theme';
import GuardPanel from './Guardpanel';
import DriverPanel from './Driverpanel';
import Revenuechart from './Revenuechart';
import { useAdminOps, GuardReviewPanel, SupportInboxPanel } from './AdminOpsPanel';
import parkitiLogo from '../logo/logo.png';
import { Outlet } from 'react-router-dom';
import { useLang } from './i18n';

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

function NavPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `1px solid ${active ? theme.colors.borderStrong : 'rgba(255,255,255,0.12)'}`,
        color: theme.colors.textPrimary,
        borderRadius: theme.radius.sm,
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: theme.fonts.body,
        ...theme.type.caption,
      }}
    >
      {label}
      {count > 0 && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: theme.colors.accent,
            color: '#000',
            fontWeight: 700,
            fontSize: 11,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function DashboardLayout({ children, user }) {
  const [guardCollapsed, setGuardCollapsed] = useState(false);
  const [driverCollapsed, setDriverCollapsed] = useState(false);
  const [revenueCollapsed, setRevenueCollapsed] = useState(false);
  const [guardReviewOpen, setGuardReviewOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { lang, setLang, t } = useLang();

  const { reviewQueue, guardImages, openTickets, resolveTicket, decideGuard } = useAdminOps();
  const revenueHeight = revenueCollapsed ? 36 : 220;
  const opsPanelBottom = 16 + revenueHeight + 12;

  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', background: theme.colors.bg }}>
      {/* Map fills the entire viewport, behind everything */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>{children}</div>

      <header
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${theme.space.xl}px`,
          zIndex: 30,
          ...glassPanelStyle,
          borderRadius: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
  <img
    src={parkitiLogo}
    alt="Parkiti"
    style={{
      height: 130,
      width: 130,
      objectFit: 'contain',
      marginRight: theme.space.sm,
    }}
  />
</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.lg }}>
          {/* Ops buttons: open the Guard review / Support inbox panels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.sm }}>
            <NavPill
              label="Guard review"
              count={reviewQueue.length}
              active={guardReviewOpen}
              onClick={() => setGuardReviewOpen((v) => !v)}
            />
            <NavPill
              label="Support inbox"
              count={openTickets.length}
              active={supportOpen}
              onClick={() => setSupportOpen((v) => !v)}
            />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textSecondary }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.reserved, display: 'inline-block' }} />
              Reserved
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textSecondary }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.unreserved, display: 'inline-block' }} />
              Navigating
            </div>
          </div>

          <span style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textMuted }}>
            {now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Africa/Casablanca' })} · Maroc
          </span>

          {user?.email && (
            <span style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textSecondary }}>
              {user.email}
            </span>
          )}

          <button
            onClick={() => signOut(auth)}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.borderStrong}`,
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.sm,
              padding: '6px 13px',
              cursor: 'pointer',
              fontFamily: theme.fonts.body,
              ...theme.type.caption,
            }}
          >
            Sign out
          </button>

          <button
  onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
  style={{
    background: 'transparent',
    border: `1px solid ${theme.colors.borderStrong}`,
    color: theme.colors.textPrimary,
    borderRadius: theme.radius.sm,
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    ...theme.type.caption,
  }}
>
  {lang === 'fr' ? 'EN' : 'FR'}
</button>
        </div>
      </header>

      <div style={{ position: 'absolute', top: 84, left: 0, bottom: 0, zIndex: 20 }}>
        <GuardPanel collapsed={guardCollapsed} onToggle={() => setGuardCollapsed((v) => !v)} />
      </div>


      <div style={{ position: 'absolute', top: 84, right: 0, bottom: 0, zIndex: 20 }}>
        <DriverPanel collapsed={driverCollapsed} onToggle={() => setDriverCollapsed((v) => !v)} />
      </div>
      {guardReviewOpen && (
  <div
    style={{
      position: 'absolute',
      top: 100,
      left: 352,
      bottom: opsPanelBottom,
      zIndex: 25,
      display: 'flex',
      pointerEvents: 'none',
    }}
  >
    <div style={{ pointerEvents: 'auto', height: '100%', display: 'flex' }}>
      <GuardReviewPanel
        reviewQueue={reviewQueue}
        guardImages={guardImages}
        onDecide={decideGuard}
        onClose={() => setGuardReviewOpen(false)}
      />
    </div>
  </div>
)}

      {supportOpen && (
  <div
    style={{
      position: 'absolute',
      top: 100,
      right: 352,
      bottom: opsPanelBottom,
      zIndex: 25,
      display: 'flex',
      pointerEvents: 'none',
    }}
  >
    <div style={{ pointerEvents: 'auto', height: '100%', display: 'flex' }}>
      <SupportInboxPanel
        openTickets={openTickets}
        onResolve={resolveTicket}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  </div>
)}

      {/* Revenue chart — floats bottom-center, same glass shape as the panels */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 352,
          right: 352,
          zIndex: 12,
        }}
      >
        <Revenuechart collapsed={revenueCollapsed} onToggle={() => setRevenueCollapsed((v) => !v)} />
      </div>

      {/* Detail overlay — rendered when a nested route (/guard/:id or /driver/:id) matches */}
      <Outlet />
    </div>
  );
}