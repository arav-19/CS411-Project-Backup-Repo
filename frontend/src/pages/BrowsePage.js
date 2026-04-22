import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const CATEGORIES = ['All', 'Courts', 'Pool', 'Training', 'Classes'];
const TIME_FILTERS = [
  { label: 'Any Time', value: '' },
  { label: 'Morning (6–12)', value: 'morning' },
  { label: 'Afternoon (12–5)', value: 'afternoon' },
  { label: 'Evening (5–10)', value: 'evening' },
];

const S = {
  page: { padding: '16px 16px 80px' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' },
  cats: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 },
  catChip: (active) => ({ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', background: active ? '#cc0000' : '#f0f0f0', color: active ? '#fff' : '#444', transition: 'all 0.2s' }),
  filters: { display: 'flex', gap: 8, marginBottom: 16 },
  select: { padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' },
  card: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  capacityBar: (pct) => ({ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden', flex: 1, marginRight: 12 }),
  capacityFill: (pct) => ({ height: '100%', borderRadius: 3, width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e', transition: 'width 0.3s' }),
  viewBtn: { padding: '7px 18px', background: '#cc0000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#888' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  emptyHint: { fontSize: 14 },
  fullBadge: { background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 },
};

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function formatDate(dt) {
  return new Date(dt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BrowsePage({ onViewSession }) {
  const [sessions, setSessions] = useState([]);
  const [category, setCategory] = useState('All');
  const [timeFilter, setTimeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (timeFilter) params.set('time_filter', timeFilter);
      const data = await api.get(`/sessions?${params}`);
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, timeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={S.page}>
      <div style={S.cats}>
        {CATEGORIES.map(c => (
          <button key={c} style={S.catChip(category === c)} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      <div style={S.filters}>
        <select style={S.select} value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
          {TIME_FILTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={S.empty}><div style={S.emptyIcon}>⏳</div><div style={S.emptyTitle}>Loading sessions...</div></div>
      ) : sessions.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>🏃</div>
          <div style={S.emptyTitle}>{timeFilter || category !== 'All' ? 'No results match your filters' : 'No sessions available'}</div>
          <div style={S.emptyHint}>{timeFilter || category !== 'All' ? 'Try clearing filters or selecting a different category.' : 'Check back later or create a new session.'}</div>
          {(timeFilter || category !== 'All') && (
            <button style={{ ...S.viewBtn, marginTop: 16 }} onClick={() => { setCategory('All'); setTimeFilter(''); }}>Clear Filters</button>
          )}
        </div>
      ) : (
        sessions.map(s => {
          const count = s.roster_count || s.current_count;
          const pct = (count / s.max_capacity) * 100;
          const full = count >= s.max_capacity;
          return (
            <div key={s.id} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={S.cardTitle}>{s.title}</div>
                {full && <span style={S.fullBadge}>FULL</span>}
              </div>
              <div style={S.cardMeta}>
                📅 {formatDate(s.start_time)} &nbsp;·&nbsp; 🕐 {formatTime(s.start_time)} – {formatTime(s.end_time)}
              </div>
              <div style={S.cardMeta}>📍 {s.location}</div>
              <div style={S.cardBottom}>
                <div style={S.capacityBar(pct)}>
                  <div style={S.capacityFill(pct)} />
                </div>
                <span style={{ fontSize: 12, color: '#888', marginRight: 12 }}>{count}/{s.max_capacity}</span>
                <button style={S.viewBtn} onClick={() => onViewSession(s.id)}>View</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
