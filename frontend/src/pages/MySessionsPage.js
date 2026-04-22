import React, { useState, useEffect } from 'react';
import { api } from '../api';

const S = {
  page: { padding: '16px 16px 100px' },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 },
  tabs: { display: 'flex', gap: 0, marginBottom: 16, background: '#f0f0f0', borderRadius: 10, padding: 4 },
  tab: (active) => ({ flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active ? '#fff' : 'transparent', color: active ? '#cc0000' : '#888', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
  card: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#777', marginBottom: 4 },
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: color === 'green' ? '#dcfce7' : color === 'red' ? '#fee2e2' : color === 'yellow' ? '#fef9c3' : '#f3f4f6', color: color === 'green' ? '#166534' : color === 'red' ? '#dc2626' : color === 'yellow' ? '#854d0e' : '#374151', marginTop: 6 }),
  cancelBtn: { padding: '7px 14px', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  leaveBtn: { padding: '7px 14px', background: '#fff', color: '#888', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#999', fontSize: 14 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  loading: { textAlign: 'center', padding: '60px 0', color: '#999', fontSize: 14 },
};

function formatDateTime(dt) {
  return new Date(dt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MySessionsPage({ onViewSession }) {
  const [tab, setTab] = useState('joined');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sessions/my');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLeave = async (sid) => {
    if (!window.confirm('Leave this session?')) return;
    try {
      await api.post(`/sessions/${sid}/leave`, {});
      load();
    } catch (e) { alert(e.message); }
  };

  const handleCancel = async (sid) => {
    if (!window.confirm('Cancel this session? This cannot be undone.')) return;
    try {
      await api.post(`/sessions/${sid}/cancel`, {});
      load();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div style={S.loading}>Loading...</div>;

  const joined = data?.joined || [];
  const organised = data?.organised || [];
  const waitlisted = data?.waitlisted || [];

  const statusColor = (s) => s === 'active' ? 'green' : s === 'cancelled' ? 'red' : 'gray';

  return (
    <div style={S.page}>
      <div style={S.title}>My Sessions</div>

      <div style={S.tabs}>
        <button style={S.tab(tab === 'joined')} onClick={() => setTab('joined')}>
          Joined {joined.length > 0 && `(${joined.length})`}
        </button>
        <button style={S.tab(tab === 'organised')} onClick={() => setTab('organised')}>
          Organised {organised.length > 0 && `(${organised.length})`}
        </button>
        <button style={S.tab(tab === 'waitlist')} onClick={() => setTab('waitlist')}>
          Waitlist {waitlisted.length > 0 && `(${waitlisted.length})`}
        </button>
      </div>

      {tab === 'joined' && (
        joined.length === 0
          ? <div style={S.empty}><div style={S.emptyIcon}>🏃</div>You haven't joined any sessions yet.</div>
          : joined.map(s => (
            <div key={s.id} style={S.card}>
              <div style={S.cardTitle}>{s.title}</div>
              <div style={S.cardMeta}>📅 {formatDateTime(s.start_time)}</div>
              <div style={S.cardMeta}>📍 {s.location} &nbsp;·&nbsp; 👤 {s.organizer_name}</div>
              <div style={S.badge(statusColor(s.status))}>{s.status.toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.leaveBtn} onClick={() => onViewSession(s.id)}>View</button>
                {s.status === 'active' && <button style={S.leaveBtn} onClick={() => handleLeave(s.id)}>Leave</button>}
              </div>
            </div>
          ))
      )}

      {tab === 'organised' && (
        organised.length === 0
          ? <div style={S.empty}><div style={S.emptyIcon}>📋</div>You haven't created any sessions yet.</div>
          : organised.map(s => (
            <div key={s.id} style={S.card}>
              <div style={S.cardTitle}>{s.title}</div>
              <div style={S.cardMeta}>📅 {formatDateTime(s.start_time)}</div>
              <div style={S.cardMeta}>📍 {s.location} &nbsp;·&nbsp; 👥 {s.current_count}/{s.max_capacity} joined</div>
              <div style={S.badge(statusColor(s.status))}>{s.status.toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.leaveBtn} onClick={() => onViewSession(s.id)}>View</button>
                {s.status === 'active' && <button style={S.cancelBtn} onClick={() => handleCancel(s.id)}>Cancel Session</button>}
              </div>
            </div>
          ))
      )}

      {tab === 'waitlist' && (
        waitlisted.length === 0
          ? <div style={S.empty}><div style={S.emptyIcon}>⏳</div>You're not on any waitlists.</div>
          : waitlisted.map(s => (
            <div key={s.id} style={S.card}>
              <div style={S.cardTitle}>{s.title}</div>
              <div style={S.cardMeta}>📅 {formatDateTime(s.start_time)}</div>
              <div style={S.cardMeta}>📍 {s.location}</div>
              <div style={S.badge('yellow')}>WAITLIST #{s.waitlist_position}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.leaveBtn} onClick={() => onViewSession(s.id)}>View</button>
                <button style={S.leaveBtn} onClick={() => handleLeave(s.id)}>Leave Waitlist</button>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
