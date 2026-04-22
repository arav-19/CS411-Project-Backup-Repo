import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import BrowsePage from './pages/BrowsePage';
import SessionDetailPage from './pages/SessionDetailPage';
import LogWorkoutPage from './pages/LogWorkoutPage';
import ProgressPage from './pages/ProgressPage';
import CreateSessionPage from './pages/CreateSessionPage';
import MySessionsPage from './pages/MySessionsPage';

const NAV = [
  { key: 'browse', label: 'Browse', icon: '🏃' },
  { key: 'create', label: 'Create', icon: '➕' },
  { key: 'log', label: 'Log', icon: '📝' },
  { key: 'my', label: 'My Sessions', icon: '📋' },
  { key: 'progress', label: 'Progress', icon: '📊' },
];

const S = {
  app: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', position: 'relative' },
  topBar: { background: '#cc0000', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  topLogo: { fontSize: 20, fontWeight: 800, color: '#fff' },
  topUser: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  content: { paddingTop: 0, paddingBottom: 0 },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid #e0e0e0', display: 'flex', zIndex: 100 },
  navBtn: () => ({ flex: 1, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }),
  navIcon: { fontSize: 18 },
  navLabel: (active) => ({ fontSize: 9, fontWeight: 600, color: active ? '#cc0000' : '#999' }),
  navDot: (active) => ({ width: 4, height: 4, borderRadius: '50%', background: active ? '#cc0000' : 'transparent', marginTop: 2 }),
};

function MainApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('browse');
  const [viewingSession, setViewingSession] = useState(null);
  const [progressKey, setProgressKey] = useState(0);

  if (!user) return <AuthPage />;

  const handleViewSession = (id) => { setViewingSession(id); };
  const handleBackFromSession = () => { setViewingSession(null); };
  const handleWorkoutSaved = () => { setProgressKey(k => k + 1); };

  const goTo = (newTab) => { setViewingSession(null); setTab(newTab); };

  const renderContent = () => {
    if (viewingSession) {
      return <SessionDetailPage sessionId={viewingSession} onBack={handleBackFromSession} />;
    }
    switch (tab) {
      case 'browse': return <BrowsePage onViewSession={handleViewSession} />;
      case 'create': return <CreateSessionPage onCreated={() => goTo('my')} onBrowse={() => goTo('browse')} />;
      case 'log': return <LogWorkoutPage onSaved={handleWorkoutSaved} />;
      case 'my': return <MySessionsPage onViewSession={handleViewSession} />;
      case 'progress': return <ProgressPage key={progressKey} />;
      default: return <BrowsePage onViewSession={handleViewSession} />;
    }
  };

  return (
    <div style={S.app}>
      <div style={S.topBar}>
        <div style={S.topLogo}>Fit2BU</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={S.topUser}>👋 {user.display_name}</span>
          <button style={S.logoutBtn} onClick={logout}>Log out</button>
        </div>
      </div>
      <div style={S.content}>{renderContent()}</div>
      {!viewingSession && (
        <div style={S.bottomNav}>
          {NAV.map(n => (
            <button key={n.key} style={S.navBtn(tab === n.key)} onClick={() => goTo(n.key)}>
              <span style={S.navIcon}>{n.icon}</span>
              <span style={S.navLabel(tab === n.key)}>{n.label}</span>
              <div style={S.navDot(tab === n.key)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <AuthProvider><MainApp /></AuthProvider>;
}
