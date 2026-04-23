import React, { useState, useEffect } from 'react';
import { api } from '../api';

const S = {
  page: { padding: '16px 16px 80px' },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  statCard: (color) => ({ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }),
  statValue: { fontSize: 28, fontWeight: 800, color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  workoutCard: (expanded) => ({
    borderRadius: 10,
    border: '1px solid #f0f0f0',
    marginBottom: 10,
    overflow: 'hidden',
    background: expanded ? '#fafafa' : '#fff',
  }),
  workoutHeader: { padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  workoutLeft: { flex: 1 },
  workoutTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a1a' },
  workoutDate: { fontSize: 12, color: '#999', marginBottom: 2 },
  workoutMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  chevron: (expanded) => ({ fontSize: 12, color: '#aaa', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }),
  deleteBtn: { background: 'none', border: 'none', color: '#ddd', fontSize: 16, cursor: 'pointer', padding: '0 0 0 10px' },
  expandedBody: { padding: '0 14px 14px' },
  exerciseBlock: { marginBottom: 12 },
  exerciseName: { fontSize: 13, fontWeight: 700, color: '#cc0000', marginBottom: 6 },
  setRow: { display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' },
  setNum: { fontSize: 11, color: '#aaa', width: 36 },
  setChip: { background: '#f5f5f5', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#444' },
  divider: { borderBottom: '1px solid #f0f0f0', margin: '10px 0' },
  empty: { textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 },
};

function groupSets(sets) {
  const map = {};
  sets.forEach(s => {
    if (!map[s.exercise_name]) map[s.exercise_name] = [];
    map[s.exercise_name].push(s);
  });
  return map;
}

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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
      if (expanded === id) setExpanded(null);
      load();
    } catch (e) { alert(e.message); }
  };

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  return (
    <div style={S.page}>
      <div style={S.title}>Progress</div>
      {loading ? <div style={S.empty}>Loading...</div> : (
        <>
          <div style={S.statsGrid}>
            <div style={S.statCard('#cc0000')}>
              <div style={S.statValue}>{stats?.total_workouts || 0}</div>
              <div style={S.statLabel}>Workouts this month</div>
            </div>
            <div style={S.statCard('#f59e0b')}>
              <div style={S.statValue}>{stats?.streak || 0} 🔥</div>
              <div style={S.statLabel}>Day streak</div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Recent Workouts</div>
            {workouts.length === 0
              ? <div style={S.empty}>No workouts logged yet.<br />Head to the Log tab to get started!</div>
              : workouts.map(w => {
                  const isExpanded = expanded === w.id;
                  const grouped = groupSets(w.sets || []);
                  const exerciseNames = Object.keys(grouped);
                  const totalSets = (w.sets || []).length;

                  return (
                    <div key={w.id} style={S.workoutCard(isExpanded)}>
                      <div style={S.workoutHeader} onClick={() => toggle(w.id)}>
                        <div style={S.workoutLeft}>
                          <div style={S.workoutDate}>
                            {new Date(w.logged_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div style={S.workoutTitle}>{w.title}</div>
                          <div style={S.workoutMeta}>
                            {exerciseNames.length} exercise{exerciseNames.length !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={S.chevron(isExpanded)}>▼</span>
                          <button style={S.deleteBtn} onClick={e => { e.stopPropagation(); deleteWorkout(w.id); }}>🗑</button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={S.expandedBody}>
                          <div style={S.divider} />
                          {exerciseNames.map((exName, ei) => (
                            <div key={exName} style={S.exerciseBlock}>
                              <div style={S.exerciseName}>{exName}</div>
                              {grouped[exName].map((s, i) => (
                                <div key={i} style={S.setRow}>
                                  <span style={S.setNum}>Set {s.set_number}</span>
                                  {s.reps && <span style={S.setChip}>{s.reps} reps</span>}
                                  {s.weight && <span style={S.setChip}>{s.weight} lbs</span>}
                                  {s.duration && <span style={S.setChip}>{s.duration} min</span>}
                                  {!s.reps && !s.weight && !s.duration && <span style={S.setChip}>logged</span>}
                                </div>
                              ))}
                              {ei < exerciseNames.length - 1 && <div style={{ ...S.divider, margin: '8px 0' }} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </>
      )}
    </div>
  );
}
