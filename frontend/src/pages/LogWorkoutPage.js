import React, { useState } from 'react';
import { api } from '../api';

const TEMPLATES = {
  Lifting: [
    { exercise_name: 'Bench Press', sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }] },
    { exercise_name: 'Squat', sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }] },
    { exercise_name: 'Deadlift', sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }] },
  ],
  Cardio: [
    { exercise_name: 'Treadmill Run', sets: [{ reps: '', weight: '', duration: '' }] },
    { exercise_name: 'Rowing Machine', sets: [{ reps: '', weight: '', duration: '' }] },
  ],
  Basketball: [
    { exercise_name: 'Dribbling Drills', sets: [{ reps: '', weight: '', duration: '' }] },
    { exercise_name: 'Free Throws', sets: [{ reps: '', weight: '' }] },
  ],
};

const S = {
  page: { padding: '16px 16px 80px' },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 },
  templates: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tmplBtn: (active) => ({ padding: '8px 18px', borderRadius: 20, border: '2px solid', borderColor: active ? '#cc0000' : '#e0e0e0', background: active ? '#cc0000' : '#fff', color: active ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
  blankBtn: (active) => ({ padding: '8px 18px', borderRadius: 20, border: '2px dashed', borderColor: active ? '#cc0000' : '#ccc', background: active ? '#fff5f5' : '#fff', color: active ? '#cc0000' : '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
  card: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  exLabel: { fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  exInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 10 },
  setRow: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  setLabel: { fontSize: 12, color: '#999', width: 40, flexShrink: 0 },
  setInput: { flex: 1, padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' },
  addSetBtn: { width: '100%', padding: '9px 0', border: '1.5px dashed #e0e0e0', borderRadius: 8, background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  addExBtn: { width: '100%', padding: '12px 0', border: '2px dashed #cc0000', borderRadius: 10, background: '#fff5f5', color: '#cc0000', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  saveBtn: { width: '100%', padding: '14px 0', background: '#cc0000', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  toast: (ok) => ({ padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#166534' : '#dc2626', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, marginBottom: 12 }),
  error: (show) => ({ display: show ? 'block' : 'none', color: '#dc2626', fontSize: 12, marginTop: -8, marginBottom: 6 }),
  removeBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
  titleInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 16 },
  titleLabel: { fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' },
};

function blankExercise() {
  return { exercise_name: '', sets: [{ reps: '', weight: '' }] };
}

export default function LogWorkoutPage({ onSaved }) {
  const [template, setTemplate] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState('');
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectTemplate = (name) => {
    setTemplate(name);
    setExercises(TEMPLATES[name].map(e => ({ ...e, sets: e.sets.map(s => ({ ...s })) })));
    setTitle(name + ' Workout');
    setToast(null); setSaved(false); setErrors({});
  };

  const selectBlank = () => {
    setTemplate('blank');
    setExercises([blankExercise()]);
    setTitle('');
    setToast(null); setSaved(false); setErrors({});
  };

  const updateExName = (ei, val) => {
    setExercises(ex => ex.map((e, i) => i === ei ? { ...e, exercise_name: val } : e));
  };

  const updateSet = (ei, si, field, val) => {
    setExercises(ex => ex.map((e, i) => i === ei
      ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) }
      : e));
  };

  const addSet = (ei) => {
    setExercises(ex => ex.map((e, i) => i === ei ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e));
  };

  const removeSet = (ei, si) => {
    setExercises(ex => ex.map((e, i) => i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e));
  };

  const addExercise = () => { setExercises(ex => [...ex, blankExercise()]); };

  const removeExercise = (ei) => { setExercises(ex => ex.filter((_, i) => i !== ei)); };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Workout title is required';
    exercises.forEach((ex, i) => {
      if (!ex.exercise_name.trim()) errs[`ex_${i}`] = 'Exercise name is required';
      ex.sets.forEach((s, j) => {
        if (s.weight !== '' && s.weight !== undefined) {
          const w = parseFloat(s.weight);
          if (isNaN(w) || w < 0) errs[`set_${i}_${j}_weight`] = 'Invalid weight';
          else if (w > 2000) errs[`set_${i}_${j}_weight`] = 'Weight seems unreasonably high. Please check your entry.';
        }
        if (s.reps !== '' && s.reps !== undefined) {
          const r = parseInt(s.reps);
          if (isNaN(r) || r < 0) errs[`set_${i}_${j}_reps`] = 'Invalid reps';
        }
      });
    });
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await api.post('/workouts', { title, exercises });
      setToast({ ok: true, msg: 'Workout saved.' });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setTemplate(null); setExercises([]); setTitle(''); setToast(null); setErrors({}); setSaved(false); };

  return (
    <div style={S.page}>
      <div style={S.title}>Log Workout</div>

      {!template ? (
        <>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Choose a template or start blank:</div>
          <div style={S.templates}>
            {Object.keys(TEMPLATES).map(t => (
              <button key={t} style={S.tmplBtn(false)} onClick={() => selectTemplate(t)}>{t}</button>
            ))}
            <button style={S.blankBtn(false)} onClick={selectBlank}>+ Blank Log</button>
          </div>
        </>
      ) : saved ? (
        <div>
          <div style={S.toast(true)}>✅ Workout saved.</div>
          <button style={{ ...S.saveBtn, background: '#166534' }} onClick={reset}>Log Another Workout</button>
        </div>
      ) : (
        <>
          <div style={S.templates}>
            {Object.keys(TEMPLATES).map(t => (
              <button key={t} style={S.tmplBtn(template === t)} onClick={() => selectTemplate(t)}>{t}</button>
            ))}
            <button style={S.blankBtn(template === 'blank')} onClick={selectBlank}>+ Blank Log</button>
          </div>

          {toast && <div style={S.toast(toast.ok)}>{toast.msg}</div>}

          <label style={S.titleLabel}>Workout Title</label>
          <input style={{ ...S.titleInput, borderColor: errors.title ? '#ef4444' : '#e0e0e0' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monday Push Day" />
          {errors.title && <div style={{ color: '#dc2626', fontSize: 12, marginTop: -10, marginBottom: 10 }}>{errors.title}</div>}

          {exercises.map((ex, ei) => (
            <div key={ei} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={S.exLabel}>Exercise {ei + 1}</div>
                {exercises.length > 1 && <button style={S.removeBtn} onClick={() => removeExercise(ei)}>✕</button>}
              </div>
              <input
                style={{ ...S.exInput, borderColor: errors[`ex_${ei}`] ? '#ef4444' : '#e0e0e0' }}
                value={ex.exercise_name}
                onChange={e => updateExName(ei, e.target.value)}
                placeholder="Exercise name (e.g. Bench Press)"
              />
              {errors[`ex_${ei}`] && <div style={{ color: '#dc2626', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{errors[`ex_${ei}`]}</div>}

              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 2, fontSize: 11, color: '#999', fontWeight: 700 }}>REPS</div>
                <div style={{ flex: 2, fontSize: 11, color: '#999', fontWeight: 700 }}>WEIGHT (lbs)</div>
                <div style={{ width: 28 }} />
              </div>

              {ex.sets.map((s, si) => (
                <div key={si}>
                  <div style={S.setRow}>
                    <span style={S.setLabel}>Set {si + 1}</span>
                    <input style={{ ...S.setInput, borderColor: errors[`set_${ei}_${si}_reps`] ? '#ef4444' : '#e0e0e0' }} type="number" min="0" value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)} placeholder="—" />
                    <input style={{ ...S.setInput, borderColor: errors[`set_${ei}_${si}_weight`] ? '#ef4444' : '#e0e0e0' }} type="number" min="0" value={s.weight} onChange={e => updateSet(ei, si, 'weight', e.target.value)} placeholder="—" />
                    {ex.sets.length > 1 && <button style={S.removeBtn} onClick={() => removeSet(ei, si)}>✕</button>}
                  </div>
                  {errors[`set_${ei}_${si}_weight`] && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 6 }}>{errors[`set_${ei}_${si}_weight`]}</div>}
                  {errors[`set_${ei}_${si}_reps`] && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 6 }}>{errors[`set_${ei}_${si}_reps`]}</div>}
                </div>
              ))}
              <button style={S.addSetBtn} onClick={() => addSet(ei)}>+ Add Set</button>
            </div>
          ))}

          <button style={S.addExBtn} onClick={addExercise}>+ Add Exercise</button>
          <button style={S.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Workout'}</button>
        </>
      )}
    </div>
  );
}
