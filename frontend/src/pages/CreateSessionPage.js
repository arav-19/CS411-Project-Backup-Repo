import React, { useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['Courts', 'Pool', 'Training', 'Classes'];
const ACTIVITY_TYPES = {
  Courts: ['Basketball', 'Tennis', 'Racquetball', 'Volleyball', 'Badminton'],
  Pool: ['Lap Swimming', 'Water Polo', 'Aqua Fitness', 'Diving'],
  Training: ['Weightlifting', 'Cardio', 'CrossFit', 'Yoga', 'Pilates', 'HIIT'],
  Classes: ['Spin', 'Zumba', 'Kickboxing', 'Bootcamp', 'Stretching'],
};

const S = {
  page: { padding: '16px 16px 100px' },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'block', marginTop: 14 },
  input: (err) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${err ? '#ef4444' : '#e0e0e0'}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }),
  select: (err) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${err ? '#ef4444' : '#e0e0e0'}`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }),
  textarea: (err) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${err ? '#ef4444' : '#e0e0e0'}`, borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', fontFamily: 'inherit' }),
  errMsg: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  saveBtn: (disabled) => ({ width: '100%', padding: '14px 0', background: disabled ? '#ccc' : '#cc0000', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 20 }),
  toast: (ok) => ({ padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#166534' : '#dc2626', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, marginBottom: 16 }),
  successCard: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  btnRow: { display: 'flex', gap: 10 },
  outlineBtn: { flex: 1, padding: '12px 0', background: '#fff', color: '#cc0000', border: '1.5px solid #cc0000', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  redBtn: { flex: 1, padding: '12px 0', background: '#cc0000', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

function nowPlusHours(h) {
  const d = new Date(Date.now() + h * 3600000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function CreateSessionPage({ onCreated, onBrowse }) {
  const [form, setForm] = useState({
    title: '',
    category: '',
    activity_type: '',
    description: '',
    location: '',
    start_time: nowPlusHours(1),
    end_time: nowPlusHours(2),
    max_capacity: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [created, setCreated] = useState(null);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined }));
    if (field === 'category') setForm(f => ({ ...f, category: val, activity_type: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.activity_type) e.activity_type = 'Activity type is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.start_time) e.start_time = 'Start time is required';
    else if (new Date(form.start_time) < new Date()) e.start_time = 'Start time must be in the future';
    if (!form.end_time) e.end_time = 'End time is required';
    else if (form.end_time <= form.start_time) e.end_time = 'End time must be after start time';
    if (!form.max_capacity) e.max_capacity = 'Max capacity is required';
    else if (isNaN(form.max_capacity) || +form.max_capacity < 1 || +form.max_capacity > 500)
      e.max_capacity = 'Must be between 1 and 500';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const res = await api.post('/sessions', { ...form, max_capacity: +form.max_capacity });
      setCreated({ id: res.id, title: form.title });
      setToast(null);
    } catch (err) {
      setToast({ ok: false, msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm({ title: '', category: '', activity_type: '', description: '', location: '', start_time: nowPlusHours(1), end_time: nowPlusHours(2), max_capacity: '' });
    setErrors({}); setToast(null); setCreated(null);
  };

  if (created) {
    return (
      <div style={S.page}>
        <div style={S.successCard}>
          <div style={S.successIcon}>🎉</div>
          <div style={S.successTitle}>Session Created!</div>
          <div style={S.successSub}>"{created.title}" is now live and visible to other users.</div>
          <div style={S.btnRow}>
            <button style={S.outlineBtn} onClick={reset}>Create Another</button>
            <button style={S.redBtn} onClick={onBrowse}>Browse Sessions</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.title}>Create Session</div>
      <div style={S.subtitle}>Fill in the details to publish a new session</div>

      {toast && <div style={S.toast(toast.ok)}>{toast.msg}</div>}

      <label style={S.label}>Session Title *</label>
      <input
        style={S.input(errors.title)}
        value={form.title}
        onChange={e => set('title', e.target.value)}
        placeholder="e.g. Saturday Basketball Pickup"
      />
      {errors.title && <div style={S.errMsg}>{errors.title}</div>}

      <div style={S.row}>
        <div>
          <label style={S.label}>Category *</label>
          <select style={S.select(errors.category)} value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Select...</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <div style={S.errMsg}>{errors.category}</div>}
        </div>
        <div>
          <label style={S.label}>Activity Type *</label>
          <select style={S.select(errors.activity_type)} value={form.activity_type} onChange={e => set('activity_type', e.target.value)} disabled={!form.category}>
            <option value="">Select...</option>
            {(ACTIVITY_TYPES[form.category] || []).map(a => <option key={a}>{a}</option>)}
          </select>
          {errors.activity_type && <div style={S.errMsg}>{errors.activity_type}</div>}
        </div>
      </div>

      <label style={S.label}>Location *</label>
      <input
        style={S.input(errors.location)}
        value={form.location}
        onChange={e => set('location', e.target.value)}
        placeholder="e.g. FitRec Court 2"
      />
      {errors.location && <div style={S.errMsg}>{errors.location}</div>}

      <div style={S.row}>
        <div>
          <label style={S.label}>Start Time *</label>
          <input type="datetime-local" style={S.input(errors.start_time)} value={form.start_time} onChange={e => set('start_time', e.target.value)} />
          {errors.start_time && <div style={S.errMsg}>{errors.start_time}</div>}
        </div>
        <div>
          <label style={S.label}>End Time *</label>
          <input type="datetime-local" style={S.input(errors.end_time)} value={form.end_time} onChange={e => set('end_time', e.target.value)} />
          {errors.end_time && <div style={S.errMsg}>{errors.end_time}</div>}
        </div>
      </div>

      <label style={S.label}>Max Capacity *</label>
      <input
        type="number"
        style={S.input(errors.max_capacity)}
        value={form.max_capacity}
        onChange={e => set('max_capacity', e.target.value)}
        placeholder="e.g. 10"
        min="1" max="500"
      />
      {errors.max_capacity && <div style={S.errMsg}>{errors.max_capacity}</div>}

      <label style={S.label}>Description</label>
      <textarea
        style={S.textarea(false)}
        value={form.description}
        onChange={e => set('description', e.target.value)}
        placeholder="Optional — describe what participants can expect"
      />

      <button style={S.saveBtn(saving)} onClick={handleSubmit} disabled={saving}>
        {saving ? 'Creating...' : 'Create Session'}
      </button>
    </div>
  );
}
