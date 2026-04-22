import React, { useState, useEffect } from 'react';
import { api } from '../api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const S = {
  page: { padding: '16px 16px 80px' },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  statCard: (color) => ({ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }),
  statValue: { fontSize: 28, fontWeight: 800, color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 },
  bar: (h) => ({ flex: 1, background: '#cc0000', borderRadius: '4px 4px 0 0', height: `${h}%`, minHeight: 4, transition: 'height 0.4s' }),
  barLabel: { textAlign: 'center', fontSize: 11, color: '#999', marginTop: 4 },
  workoutItem: { borderBottom: '1px solid #f5f5f5', padding: '12px 0' },
  workoutTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a1a' },
  workoutDate: { fontSize: 12, color: '#999', marginBottom: 4 },
  exerciseChip: { display: 'inline-block', background: '#f5f5f5', color: '#555', fontSize: 12, padding: '3px 8px', borderRadius: 6, marginRight: 4, marginTop: 4 },
  deleteBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 14, cursor: 'pointer', float: 'right' },
  empty: { textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 },
};

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([api.get('/workouts/stats'), api.get('/workouts')]);
      setStats(s);
      setWorkouts(w);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteWorkout = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(w => w.filter(x => x.id !== id));
      load();
    } catch (e) { alert(e.message); }
  };

  const barData = (() => {
    if (!stats) return DAYS.map(d => ({ label: d, count: 0 }));
    const map = {};
    (stats.weekly_data || []).forEach(r => { map[r.day_of_week] = r.count; });
    return DAYS.map((d, i) => ({ label: d, count: map[i] || 0 }));
  })();
  const maxBar = Math.max(1, ...barData.map(b => b.count));

  return (
    <div style={S.page}>
      <div style={S.title}>Progress</div>
      {loading ? <div style={S.empty}>Loading...</div> : (
        <>
          <div style={S.statsGrid}>
            <div style={S.statCard('#cc0000')}><div style={S.statValue}>{stats?.total_workouts || 0}</div><div style={S.statLabel}>Workouts this month</div></div>
            <div style={S.statCard('#f59e0b')}><div style={S.statValue}>{stats?.streak || 0} 🔥</div><div style={S.statLabel}>Day streak</div></div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>This Week</div>
            <div style={S.chart}>
              {barData.map(b => <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={S.bar((b.count / maxBar) * 100)} />
                <div style={S.barLabel}>{b.label}</div>
              </div>)}
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Recent Workouts</div>
            {workouts.length === 0 ? <div style={S.empty}>No workouts logged yet.<br />Head to the Log Workout tab to get started!</div> : (
              workouts.slice(0, 10).map(w => (
                <div key={w.id} style={S.workoutItem}>
                  <button style={S.deleteBtn} onClick={() => deleteWorkout(w.id)}>🗑</button>
                  <div style={S.workoutDate}>{new Date(w.logged_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div style={S.workoutTitle}>{w.title}</div>
                  <div>
                    {[...new Set(w.sets.map(s => s.exercise_name))].map(ex => (
                      <span key={ex} style={S.exerciseChip}>{ex}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
