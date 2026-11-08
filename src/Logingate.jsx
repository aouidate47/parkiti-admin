import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { theme } from './Theme';

export default function Logingate({ status }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Sign-in failed — check the email and password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: theme.glass.background,
          backdropFilter: theme.glass.backdropFilter,
          WebkitBackdropFilter: theme.glass.WebkitBackdropFilter,
          border: theme.glass.border,
          boxShadow: theme.glass.boxShadow,
          borderRadius: theme.radius.lg,
          padding: theme.space.xxl,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.sm, marginBottom: theme.space.xl }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: theme.radius.sm,
              background: theme.colors.accent,
              boxShadow: `0 0 16px ${theme.colors.accentGlow}`,
            }}
          />
          <span style={{ fontFamily: theme.fonts.display, ...theme.type.subheadline, letterSpacing: 1, color: theme.colors.textSecondary, textTransform: 'uppercase' }}>
            Parkiti // Owner Console
          </span>
        </div>

        {status === 'forbidden' ? (
          <>
            <h1 style={{ fontFamily: theme.fonts.display, ...theme.type.title1, color: theme.colors.textPrimary, margin: `0 0 ${theme.space.sm}px` }}>
              This account isn't cleared
            </h1>
            <p style={{ fontFamily: theme.fonts.body, ...theme.type.body, color: theme.colors.textSecondary, lineHeight: 1.5, margin: `0 0 ${theme.space.xl}px` }}>
              You're signed in, but this account doesn't have owner access. Only accounts with{' '}
              <code style={{ background: theme.colors.bgPanelAlt, borderRadius: 4, padding: '1px 5px', fontSize: 12 }}>role: "owner"</code>{' '}
              on their user record can view this console.
            </p>
            <button
              onClick={() => signOut(auth)}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.borderStrong}`,
                color: theme.colors.textPrimary,
                borderRadius: theme.radius.sm,
                padding: '10px 16px',
                fontFamily: theme.fonts.body,
                ...theme.type.subheadline,
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: theme.fonts.display, ...theme.type.title1, color: theme.colors.textPrimary, margin: `0 0 ${theme.space.sm}px` }}>
              Sign in to watch the network
            </h1>
            <p style={{ fontFamily: theme.fonts.body, ...theme.type.body, color: theme.colors.textSecondary, margin: `0 0 ${theme.space.xl}px` }}>
              Live lots, drivers and revenue, in one console.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.space.lg }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: theme.space.xs, fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary }}>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: theme.space.xs, fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary }}>
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </label>
              {error && (
                <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.danger }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={busy}
                style={{
                  background: theme.colors.accent,
                  color: '#0B0E12',
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  padding: '11px',
                  fontWeight: 600,
                  fontFamily: theme.fonts.body,
                  ...theme.type.subheadline,
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                {busy ? 'Checking…' : 'Enter console'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#F4F6F8',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};
