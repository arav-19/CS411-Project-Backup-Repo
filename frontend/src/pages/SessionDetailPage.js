import React, { useState, useEffect } from 'react';
import { api } from '../api';

const S = {
  page: { padding: '0 0 80px' },
  header: { background: '#cc0000', padding: '20px 16px 24px', color: '#fff' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  category: { fontSize: 13, opacity: 0.85 },
  body: { padding: 16 },
  section: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  metaRow: { display: 'flex', alignItems: 'flex-start', marginBottom: 8 },
  metaIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  metaText: { fontSize: 14, color: '#333' },
  desc: { fontSize: 14, color: '#555', lineHeight: 1.6 },
  capacityWrap: { marginBottom: 8 },
  capacityLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 6 },
  bar: { height: 10, borderRadius: 5, background: '#f0f0f0', overflow: 'hidden' },
  fill: (pct) => ({ height: '100%', borderRadius: 5, width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e' }),
  joinBtn: (full) => ({ width: '100%', padding: '14px 0', background: full ? '#f59e0b' : '#cc0000', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }),
  leaveBtn: { width: '100%', padding: '14px 0', background: '#fff', color: '#cc0000', border: '2px solid #cc0000', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  toast: (ok) => ({ padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#166534' : '#dc2626', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, marginBottom: 10 }),
  organizer: { fontSize: 13, color: '#666' },
};

function fmt(dt) { return new Date(dt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

export default function SessionDetailPage({ sessionId, onBack }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/sessions/${sessionId}`);
      setSession(data);
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sessionId]);

  const handleJoin = async () => {
    setActionLoading(true);
    setToast(null);
    try {
      const res = await api.post(`/sessions/${sessionId}/join`, {});
      setToast({ ok: true, msg: res.message });
      await load();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    setToast(null);
    try {
      const res = await api.post(`/sessions/${sessionId}/leave`, {});
      setToast({ ok: true, msg: res.message });
      await load();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading session...</div>;
  if (!session) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Session not found.</div>;

  const count = session.current_count;
  const pct = (count / session.max_capacity) * 100;
  const full = count >= session.max_capacity;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>← Back</button>
        <div style={S.title}>{session.title}</div>
        <div style={S.category}>{session.category} · {session.activity_type}</div>
      </div>
      <div style={S.body}>
        {toast && <div style={S.toast(toast.ok)}>{toast.msg}</div>}

        {/* Actions */}
        {session.user_on_roster ? (
          <button style={S.leaveBtn} onClick={handleLeave} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Leave Session'}
          </button>
        ) : session.user_on_waitlist ? (
          <>
            <div style={S.toast(true)}>You are #{session.user_on_waitlist} on the waitlist</div>
            <button style={S.leaveBtn} onClick={handleLeave} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Leave Waitlist'}
            </button>
          </>
        ) : (
          <button style={S.joinBtn(full)} onClick={handleJoin} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : full ? 'Session Full — Join Waitlist' : 'Join Session'}
          </button>
        )}

        {/* Details */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Session Info</div>
          <div style={S.metaRow}><span style={S.metaIcon}>📅</span><span style={S.metaText}>{fmt(session.start_time)} – {new Date(session.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
          <div style={S.metaRow}><span style={S.metaIcon}>📍</span><span style={S.metaText}>{session.location}</span></div>
          <div style={S.metaRow}><span style={S.metaIcon}>👤</span><span style={S.metaText}>Organised by {session.organizer_name}</span></div>
          {session.description && <div style={{ ...S.desc, marginTop: 8 }}>{session.description}</div>}
        </div>

        {/* Capacity */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Capacity</div>
          <div style={S.capacityWrap}>
            <div style={S.capacityLabel}><span>Participants</span><span style={{ fontWeight: 700 }}>{count} / {session.max_capacity}</span></div>
            <div style={S.bar}><div style={S.fill(pct)} /></div>
          </div>
          {session.waitlist && session.waitlist.length > 0 && (
            <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 8, fontWeight: 600 }}>⏳ {session.waitlist.length} person{session.waitlist.length > 1 ? 's' : ''} on waitlist</div>
          )}
        </div>
      </div>
    </div>
  );
}
