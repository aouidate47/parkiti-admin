import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, updateDoc, addDoc, collection,
  serverTimestamp, Timestamp, deleteField,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { theme } from './Theme';
import { useGuards, useLots } from './useLiveData';
import { useLang } from './i18n';

const REST_OPTIONS = [
  { key: 'gdRest1', days: 1 },
  { key: 'gdRest3', days: 3 },
  { key: 'gdRest7', days: 7 },
  { key: 'gdRest15', days: 15 },
];

const CHANNELS = [
  { key: 'app', labelKey: 'gdChApp' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

const DANGER = '#ef4444';
const caption = { fontFamily: theme.fonts.body, ...theme.type.caption };
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  background: 'rgba(255,255,255,0.05)',
  color: theme.colors.textPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  fontFamily: theme.fonts.body,
  ...theme.type.footnote,
};

// SMS, WhatsApp and account deletion run on the Parkiti backend (Express).
// The backend checks the owner's Firebase token before doing anything.
async function callBackend(path, body) {
  const base = import.meta.env.VITE_BACKEND_URL;
  if (!base) throw new Error('Backend not connected. Add VITE_BACKEND_URL to the .env file and restart the dev server.');
  if (!auth.currentUser) throw new Error('Session expired. Sign in again.');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${base}/api/owner/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}


export default function GuardDetailOverlay() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { rows: guards, loading } = useGuards();
  const { rows: lots } = useLots();

  const guard = guards.find((g) => g.id === id);
  const lot = guard ? lots.find((l) => l.id === guard.lotId) : null;

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [hourly, setHourly] = useState('');
  const [daily, setDaily] = useState('');
  const [channel, setChannel] = useState('app');
  const [message, setMessage] = useState('');
  const [restIndex, setRestIndex] = useState(0);
  const [resetChannel, setResetChannel] = useState('sms');

  const restUntilMs = guard?.suspendedUntil?.toMillis?.() ?? 0;
  const onRest = restUntilMs > Date.now();

  const run = async (fn, okText) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      setNotice({ ok: true, text: okText });
    } catch (e) {
      setNotice({ ok: false, text: e.message || t('gdWrong') });
    } finally {
      setBusy(false);
    }
  };

  const startEditing = () => {
    setHourly(lot?.pricing?.pricePerHour != null ? String(lot.pricing.pricePerHour) : '');
    setDaily(lot?.pricing?.dayPrice != null ? String(lot.pricing.dayPrice) : '');
    setNotice(null);
    setEditing(true);
  };

  const savePrice = () =>
    run(async () => {
      const h = Number(hourly);
      const d = daily === '' ? null : Number(daily);
      if (!Number.isFinite(h) || h <= 0 || h > 500) throw new Error(t('gdErrHourly'));
      if (d !== null && (!Number.isFinite(d) || d <= 0 || d > 5000)) throw new Error(t('gdErrDay'));
      const update = { 'pricing.pricePerHour': h, lastUpdated: serverTimestamp() };
      if (d !== null) update['pricing.dayPrice'] = d;
      await updateDoc(doc(db, 'parkingLots', lot.id), update);
    }, t('gdPriceSaved'));

  const sendMessage = () =>
    run(async () => {
      const text = message.trim();
      if (!text) throw new Error(t('gdWriteFirst'));
      if (channel === 'app') {
        await addDoc(collection(db, 'notifications'), {
          uid: guard.id,
          title: 'Message from Parkiti',
          message: text,
          type: 'admin',
          read: false,
          createdAt: serverTimestamp(),
        });
      } else {
        await callBackend('notify-guard', { guardId: guard.id, channel, message: text });
      }
      setMessage('');
    }, channel === 'app' ? t('gdSentApp') : t('gdSentBy', { via: channel === 'sms' ? 'SMS' : 'WhatsApp' }));

  const applyRest = () => {
    const opt = REST_OPTIONS[restIndex];
    const dur = t(opt.key);
    if (!window.confirm(t('gdConfirmRest', { name: guard.name, dur }))) return;
    run(
      () =>
        updateDoc(doc(db, 'users', guard.id), {
          suspendedUntil: Timestamp.fromMillis(Date.now() + opt.days * 86400000),
          suspendedAt: serverTimestamp(),
        }),
      t('gdRestOk', { name: guard.name, dur }),
    );
  };

  const liftRest = () =>
    run(() => updateDoc(doc(db, 'users', guard.id), { suspendedUntil: deleteField() }), t('gdRestLifted'));

  const resetPassword = () => {
    if (!guard.phone) {
      setNotice({ ok: false, text: t('gdNoPhone') });
      return;
    }
    const via = resetChannel === 'sms' ? 'SMS' : 'WhatsApp';
    if (!window.confirm(t('gdConfirmPwd', { name: guard.name, phone: guard.phone, via }))) return;
    run(
      () => callBackend('reset-guard-password', { guardId: guard.id, channel: resetChannel }),
      t('gdPwdSent', { phone: guard.phone, via }),
    );
  };

  const deleteGuard = () => {
    const typed = window.prompt(t('gdPromptDelete', { name: guard.name }));
    if (!typed || typed.trim() !== String(guard.name).trim()) return;
    run(async () => {
      await callBackend('delete-guard', { guardId: guard.id });
      navigate('/');
    }, t('gdDeleted'));
  };

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
            {loading ? t('gdLoading') : guard?.name || t('gdNotFound')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.space.md }}>
            {guard && (
              <button
                onClick={() => (editing ? setEditing(false) : startEditing())}
                style={{ background: 'none', border: 'none', color: theme.colors.accent, cursor: 'pointer', fontFamily: theme.fonts.body, ...theme.type.subheadline }}
              >
                {editing ? t('gdDone') : t('gdEdit')}
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: theme.colors.textSecondary, cursor: 'pointer', fontFamily: theme.fonts.body, ...theme.type.subheadline }}
            >
              ✕
            </button>
          </div>
        </div>

        {!loading && !guard && (
          <p style={{ fontFamily: theme.fonts.body, color: theme.colors.textMuted, ...theme.type.footnote }}>
            {t('gdNoGuardId', { id })}
          </p>
        )}

        {guard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>
            <Row label={t('gdStatus')} value={lot?.isOnline ? t('gdOnline') : t('gdOffline')} />
            {onRest && <Row label={t('gdOnRestUntil')} value={new Date(restUntilMs).toLocaleString()} />}
            <Row label={t('gdAssignedLot')} value={lot?.zone || lot?.name || t('gdUnassigned')} />
            <Row label={t('gdAvailability')} value={lot ? t('gdFree', { a: lot.available, c: lot.capacity }) : '—'} />
            <Row label={t('gdPrice')} value={lot?.pricing?.pricePerHour != null ? `${lot.pricing.pricePerHour} MAD/h` : '—'} />
            <Row label={t('gdPhone')} value={guard.phone || '—'} href={guard.phone ? `tel:${guard.phone}` : undefined} />
            <Row label="CIN" value={guard.cin || '—'} />
          </div>
        )}

        {guard && editing && (
          <div style={{ marginTop: theme.space.xl, display: 'flex', flexDirection: 'column', gap: theme.space.xl }}>
            {notice && (
              <div style={{ ...caption, color: notice.ok ? theme.colors.success : DANGER }}>{notice.text}</div>
            )}

            <Section title={`${t('gdPrice')}${lot ? ` · ${lot.zone || lot.name}` : ''}`}>
              {lot ? (
                <>
                  <div style={{ display: 'flex', gap: theme.space.sm }}>
                    <label style={{ flex: 1, ...caption, color: theme.colors.textMuted }}>
                      {t('gdPerHourMad')}
                      <input
                        type="number" min="1" inputMode="decimal" value={hourly}
                        onChange={(e) => setHourly(e.target.value)} style={{ ...inputStyle, marginTop: 4 }}
                      />
                    </label>
                    <label style={{ flex: 1, ...caption, color: theme.colors.textMuted }}>
                      {t('gdPerDayMad')}
                      <input
                        type="number" min="1" inputMode="decimal" value={daily}
                        onChange={(e) => setDaily(e.target.value)} style={{ ...inputStyle, marginTop: 4 }}
                      />
                    </label>
                  </div>
                  <div><Btn tone="primary" onClick={savePrice} disabled={busy}>{t('gdSavePrice')}</Btn></div>
                </>
              ) : (
                <span style={{ ...caption, color: theme.colors.textMuted }}>{t('gdNoLot')}</span>
              )}
            </Section>

            <Section title={t('gdSendMsg')}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CHANNELS.map((c) => (
                  <Pill key={c.key} active={channel === c.key} onClick={() => setChannel(c.key)}>
                    {c.labelKey ? t(c.labelKey) : c.label}
                  </Pill>
                ))}
              </div>
              <textarea
                rows={3} maxLength={300} value={message} placeholder={t('gdPlaceholder')}
                onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.space.sm }}>
                <span style={{ ...caption, color: theme.colors.textMuted }}>
                  {channel === 'app'
                    ? `${message.length}/300`
                    : t('gdToPhone', { phone: guard.phone || t('gdNoPhoneOnFile'), n: message.length })}
                </span>
                <Btn tone="primary" onClick={sendMessage} disabled={busy || !message.trim()}>{t('gdSendBtn')}</Btn>
              </div>
            </Section>

            <Section title={t('gdRest')}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {REST_OPTIONS.map((o, i) => (
                  <Pill key={o.key} active={restIndex === i} onClick={() => setRestIndex(i)}>{t(o.key)}</Pill>
                ))}
              </div>
              <div style={{ display: 'flex', gap: theme.space.sm }}>
                <Btn onClick={applyRest} disabled={busy}>{t('gdStartRest')}</Btn>
                {onRest && <Btn onClick={liftRest} disabled={busy}>{t('gdLiftRest')}</Btn>}
              </div>
            </Section>

            <Section title={t('gdAccount')}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['sms', 'whatsapp'].map((c) => (
                  <Pill key={c} active={resetChannel === c} onClick={() => setResetChannel(c)}>
                    {c === 'sms' ? 'SMS' : 'WhatsApp'}
                  </Pill>
                ))}
              </div>
              <span style={{ ...caption, color: theme.colors.textMuted }}>{t('gdPwdNote')}</span>
              <div style={{ display: 'flex', gap: theme.space.sm, flexWrap: 'wrap' }}>
                <Btn onClick={resetPassword} disabled={busy}>{t('gdSendPwd')}</Btn>
                <Btn tone="danger" onClick={deleteGuard} disabled={busy}>{t('gdDelete')}</Btn>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontFamily: theme.fonts.body, ...theme.type.subheadline, color: theme.colors.textPrimary, marginBottom: theme.space.sm }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...caption,
        cursor: 'pointer',
        color: active ? theme.colors.bg : theme.colors.textSecondary,
        background: active ? theme.colors.accent : 'transparent',
        border: `1px solid ${active ? theme.colors.accent : theme.colors.border}`,
        borderRadius: theme.radius.pill,
        padding: '4px 11px',
      }}
    >
      {children}
    </button>
  );
}

function Btn({ onClick, disabled, tone = 'default', children }) {
  const primary = tone === 'primary';
  const danger = tone === 'danger';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: theme.fonts.body,
        ...theme.type.footnote,
        padding: '8px 12px',
        borderRadius: theme.radius.sm,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        color: primary ? theme.colors.bg : danger ? DANGER : theme.colors.textPrimary,
        background: primary ? theme.colors.accent : 'transparent',
        border: `1px solid ${primary ? theme.colors.accent : danger ? DANGER : theme.colors.border}`,
      }}
    >
      {children}
    </button>
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