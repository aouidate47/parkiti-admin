import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from './firebase';
import { theme } from './Theme';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';

function formatCreatedAt(value, lang) {
  if (!value) return '';
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/* Data hook — called once in DashboardLayout so the nav badges work   */
/* even while the panels are closed.                                   */
/* ------------------------------------------------------------------ */
export function useAdminOps() {
  const [supportTickets, setSupportTickets] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [guardImages, setGuardImages] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSupportTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'guard'));
    const unsub = onSnapshot(q, (snap) => {
      const guards = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => g.guardReviewStatus === 'pending' || (!g.guardReviewStatus && g.lotId));

      guards.sort((a, b) => (b.guardReviewRequestedAt?.seconds ?? 0) - (a.guardReviewRequestedAt?.seconds ?? 0));
      setReviewQueue(guards);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadGuardImages() {
      const nextMap = {};
      for (const guard of reviewQueue) {
        const urls = {};
        for (const side of ['recto', 'verso']) {
          try {
            urls[side] = await getDownloadURL(ref(storage, `guardIds/${guard.id}/${side}`));
          } catch {
            urls[side] = null;
          }
        }
        nextMap[guard.id] = urls;
      }
      if (!cancelled) setGuardImages(nextMap);
    }
    loadGuardImages();
    return () => {
      cancelled = true;
    };
  }, [reviewQueue]);

  async function resolveTicket(ticketId) {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
    });
  }

  async function decideGuard(uid, action) {
    await updateDoc(doc(db, 'users', uid), {
      guardReviewStatus: action,
      guardAccessAllowed: action === 'approved',
      guardReviewDecisionAt: serverTimestamp(),
    });
  }

  const openTickets = useMemo(
    () => supportTickets.filter((t) => t.status !== 'resolved'),
    [supportTickets],
  );

  return { reviewQueue, guardImages, openTickets, resolveTicket, decideGuard };
}


function PanelShell({ title, count, countLabel, onClose, children }) {
  const { t } = useLang();
  return (
    <div
      style={{
        width: 336,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(20,20,24,0.88)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: theme.space.md,
        boxShadow: '0 14px 35px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(22px) saturate(150%)',
        WebkitBackdropFilter: 'blur(22px) saturate(150%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.space.md }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: theme.fonts.display, ...theme.type.title2, color: theme.colors.textPrimary }}>{title}</span>
          <span style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.textSecondary }}>
            {count} {countLabel}
          </span>
        </div>
         <button
  onClick={onClose}
  style={{
    background: 'none',
    border: 'none',
    color: theme.colors.unreserved,
    fontFamily: theme.fonts.body,
    ...theme.type.subheadline,
    cursor: 'pointer',
  }}
>
  {t('hide')} ^
</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm, overflowY: 'auto', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guard review queue                                                  */
/* ------------------------------------------------------------------ */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '92vh',
          objectFit: 'contain',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      />
    </div>,
    document.body,
  );
}

export function GuardReviewPanel({ reviewQueue, guardImages, onDecide, onClose }) {
  const { t } = useLang();
  const [zoomed, setZoomed] = useState(null); 
  return (
    <PanelShell title={t('guardReviewQueue')} count={reviewQueue.length} countLabel={t('pending')} onClose={onClose}>
      {reviewQueue.length === 0 ? (
        <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary }}>
          {t('noGuard')}
        </div>
      ) : (
        reviewQueue.map((guard) => {
          const images = guardImages[guard.id] || { recto: null, verso: null };
          return (
            <div
              key={guard.id}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                padding: theme.space.md,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: theme.fonts.body, ...theme.type.headline, color: theme.colors.textPrimary }}>
                    {guard.name || t('guardFallback')}
                  </div>
                  <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary }}>
                    {guard.phone || guard.email || 	t('noContact')}
                  </div>
                </div>
                <div style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.accent }}>
                   {t(guard.guardReviewStatus === 'approved' ? 'statusApproved' : guard.guardReviewStatus === 'rejected' ? 'statusRejected' : 'statusPending')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {['recto', 'verso'].map((side) => (
                  <div key={side} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    {images[side] ? (
                      <img 
                        src={images[side]} 
                        alt={`${side} CIN`}
                         onClick={() => setZoomed({ src: images[side], alt: `${side} CIN` })}
                          style={{ display: 'block', width: '100%', height: 76, objectFit: 'cover', cursor: 'zoom-in'
 
                        }} 
                         />
                    ) : (
                      <div style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textMuted, fontFamily: theme.fonts.body, ...theme.type.caption }}>
                        {side === 'recto' ? t('rectoUnavailable') : t('versoUnavailable')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
  onClick={() => onDecide(guard.id, 'approved')}
  style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: 'none', background: theme.colors.success, color: '#09120A', fontWeight: 700, cursor: 'pointer' }}
>
  {t('approve')}
</button>
<button
  onClick={() => onDecide(guard.id, 'rejected')}
  style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: theme.colors.textPrimary, cursor: 'pointer' }}
>
  {t('reject')}
</button>
              </div>
            </div>
          );
        })
      )}
      {zoomed && 
      <ImageLightbox 
        src={zoomed.src} 
        alt={zoomed.alt} 
       onClose={() => setZoomed(null)} 
       />
       }
       
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Support inbox                                                       */
/* ------------------------------------------------------------------ */
export function SupportInboxPanel({ openTickets, onResolve, onClose }) {
  const { t, lang } = useLang();
  return (
    <PanelShell title={t('supportInbox')} count={openTickets.length} countLabel={t('open')} onClose={onClose}>
      {openTickets.length === 0 ? (
        <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary }}>
          {t('noTickets')}
        </div>
      ) : (
        openTickets.map((ticket) => (
          <div key={ticket.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <strong style={{ fontFamily: theme.fonts.body, ...theme.type.subheadline, color: theme.colors.textPrimary }}>
                {ticket.topic || t('general')}
              </strong>
              <span style={{ fontFamily: theme.fonts.body, ...theme.type.caption, color: theme.colors.warning }}>
                {t('statusOpen')}
              </span>
            </div>

            <div style={{ fontFamily: theme.fonts.body, ...theme.type.footnote, color: theme.colors.textSecondary, marginBottom: 8 }}>
              {ticket.email || t('anonymous')} · {formatCreatedAt(ticket.createdAt, lang)}
            </div>

            <div style={{ fontFamily: theme.fonts.body, ...theme.type.body, color: theme.colors.textPrimary, marginBottom: 10 }}>
              {ticket.message || t('noMessage')}
            </div>

            <button
              onClick={() => onResolve(ticket.id)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: theme.colors.textPrimary, padding: '8px 12px', cursor: 'pointer' }}
            >
              {t('markResolved')}
            </button>
          </div>
        ))
      )}
    </PanelShell>
  );
}