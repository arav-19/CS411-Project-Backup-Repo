import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #cc0000 0%, #8b0000 100%)' },
  card: { background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', marginBottom: 32 },
  logoText: { fontSize: 32, fontWeight: 800, color: '#cc0000' },
  logoSub: { fontSize: 14, color: '#666', marginTop: 4 },
  tab: { display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 28, border: '1px solid #e0e0e0' },
  tabBtn: (active) => ({ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: active ? '#cc0000' : '#fff', color: active ? '#fff' : '#666', transition: 'all 0.2s' }),
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 16, transition: 'border 0.2s' },
  btn: { width: '100%', padding: '13px 0', background: '#cc0000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.post('/auth/login', { email, password });
      } else {
        data = await api.post('/auth/register', { email, display_name: displayName, password });
      }
      login(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoText}>Fit2BU</div>
          <div style={S.logoSub}>BU FitRec Companion</div>
        </div>
        <div style={S.tab}>
          <button style={S.tabBtn(mode === 'login')} onClick={() => { setMode('login'); setError(''); }}>Log In</button>
          <button style={S.tabBtn(mode === 'register')} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
        </div>
        {error && <div style={S.error}>{error}</div>}
        {mode === 'register' && (
          <>
            <label style={S.label}>Display Name</label>
            <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </>
        )}
        <label style={S.label}>BU Email</label>
        <input style={S.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="user@bu.edu" type="email" />
        <label style={S.label}>Password</label>
        <input style={S.input} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Password'} type="password"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <button style={S.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
