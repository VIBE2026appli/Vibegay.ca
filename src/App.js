import React, { useState, lazy, Suspense } from 'react';
import Auth from './components/Auth';
import SalonsBrowser from './components/SalonsBrowser';
import VoiceRoom from './components/VoiceRoom';
import Tribunal from './components/Tribunal';
import EventPage from './components/EventPage';
import AdminPanel from './components/AdminPanel';
import LegalPages from './components/LegalPages';
import useProfile from './hooks/useProfile';

// Lazy-load Globe (three.js is ~800KB)
const Globe = lazy(() => import('./components/Globe'));

const T = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
};

const NAV_ITEMS = [
  { id: 'accueil',   label: 'Accueil',    icon: '🏠' },
  { id: 'texte',     label: 'Salons',     icon: '💬' },
  { id: 'voix',      label: 'Voix',       icon: '🎤' },
  { id: 'globe',     label: 'Globe',      icon: '🌍' },
  { id: 'tribunal',  label: 'Tribunal',   icon: '⚖️' },
  { id: 'evenement', label: 'QBC 2026',   icon: '🎟️' },
  { id: 'legal',     label: 'Légal',      icon: '📜' },
];

const sparkles = [[88,85],[12,20],[90,15],[5,70]];

function Home({ displayName, onLogout }) {
  const goldBorder = 'rgba(212,175,55,0.6)';
  return (
    <div style={{
      position: 'relative', minHeight: '100vh', background: '#080808',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Georgia, serif', overflow: 'hidden',
    }}>
      {/* ⚡ Bolt: Hardware accelerate heavy blur filters */}
      <div style={{ position:'absolute',top:'-10%',left:'-15%',width:'55%',height:'70%',borderRadius:'50%',background:'radial-gradient(circle,rgba(80,40,160,0.55) 0%,transparent 70%)',filter:'blur(40px)',transform:'translateZ(0)',willChange:'transform',pointerEvents:'none'}}/>
      <div style={{ position:'absolute',bottom:'-10%',right:'-10%',width:'50%',height:'60%',borderRadius:'50%',background:'radial-gradient(circle,rgba(180,130,20,0.3) 0%,transparent 70%)',filter:'blur(50px)',transform:'translateZ(0)',willChange:'transform',pointerEvents:'none'}}/>

      <div style={{
        position:'relative',zIndex:10,width:260,
        background:'linear-gradient(160deg,#1a1a1a 0%,#0d0d0d 100%)',
        borderRadius:36,border:'2px solid rgba(212,175,55,0.25)',
        boxShadow:'0 30px 80px rgba(0,0,0,0.9),0 0 40px rgba(212,175,55,0.08)',
        padding:'28px 20px 32px',display:'flex',flexDirection:'column',alignItems:'center',
      }}>
        <div style={{width:80,height:6,borderRadius:3,background:'#222',marginBottom:24}}/>
        <h1 style={{margin:'0 0 6px',fontSize:28,fontWeight:400,letterSpacing:10,color:T.gold,textShadow:'0 0 20px rgba(212,175,55,0.5)'}}>
          V I B E
        </h1>
        <div style={{color:T.goldBorder,fontSize:12,marginBottom:16,letterSpacing:1}}>
          {displayName}
        </div>
        <div style={{width:'100%',height:1,background:`linear-gradient(to right,transparent,${goldBorder},transparent)`,marginBottom:16}}/>
        <button onClick={onLogout} style={{
          background:'transparent',border:`1px solid ${T.goldBorder}`,color:T.goldBorder,
          padding:'6px 18px',cursor:'pointer',fontSize:10,letterSpacing:2,
          fontFamily:'Georgia,serif',borderRadius:20,
        }}>DÉCONNEXION</button>
      </div>

      {sparkles.map(([x,y],i) => (
        <div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,color:T.gold,fontSize:i===0?20:12,opacity:0.6,pointerEvents:'none',zIndex:5,textShadow:`0 0 8px ${T.gold}`}}>✦</div>
      ))}
    </div>
  );
}

export default function App() {
  const [authData, setAuthData] = useState(null);
  const [view, setView] = useState('accueil');

  const handleAuth = (data) => setAuthData(data);
  const handleLogout = () => { setAuthData(null); setView('accueil'); };

  if (!authData) {
    return <Auth onAuth={handleAuth} />;
  }

  const { displayName, user } = authData;
  const city = user?.user_metadata?.city || '';
  const identity = user?.user_metadata?.identity || 'Mixte';

  return <AuthenticatedApp
    user={user}
    displayName={displayName}
    city={city}
    identity={identity}
    view={view}
    setView={setView}
    onLogout={handleLogout}
  />;
}

function AuthenticatedApp({ user, displayName, city, identity, view, setView, onLogout }) {
  const { profile, loading: profileLoading } = useProfile(user);

  if (profileLoading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:T.dark, color:T.gold, fontFamily:'Georgia,serif', letterSpacing:4 }}>
        CHARGEMENT…
      </div>
    );
  }

  const isAdmin   = profile?.role === 'admin';
  const isCoAdmin = profile?.role === 'co_admin';
  const canAdmin  = isAdmin || isCoAdmin;

  const allNavItems = [
    ...NAV_ITEMS,
    ...(canAdmin ? [{ id: 'admin', label: 'Admin', icon: '🔑' }] : []),
  ];

  const renderView = () => {
    switch (view) {
      case 'texte':     return <SalonsBrowser displayName={displayName} city={city} />;
      case 'voix':      return <VoiceRoom displayName={displayName} city={city} identity={identity} />;
      case 'globe':     return (
        <Suspense fallback={<div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:T.dark,color:T.gold,fontFamily:'Georgia,serif',letterSpacing:4}}>CHARGEMENT…</div>}>
          <Globe />
        </Suspense>
      );
      case 'tribunal':  return <Tribunal displayName={displayName} />;
      case 'evenement': return <EventPage user={user} />;
      case 'admin':
        if (!canAdmin) return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:T.dark,color:'#FF6B6B',fontFamily:'Georgia,serif',letterSpacing:2}}>ACCÈS REFUSÉ</div>;
        return <AdminPanel profile={profile} />;
      case 'legal':     return <LegalPages />;
      default:          return <Home displayName={displayName} onLogout={onLogout} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.dark }}>
      <div style={{ flex: 1, paddingBottom: 64 }}>
        {renderView()}
      </div>
      {/* ⚡ Bolt: Hardware accelerate heavy blur filters */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(5,5,5,0.95)', borderTop: `1px solid ${T.goldBorder}`,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0', zIndex: 100,
        backdropFilter: 'blur(10px)', transform: 'translateZ(0)', willChange: 'transform',
        overflowX: 'auto',
      }}>
        {allNavItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 8px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{
              fontSize: 9, letterSpacing: 1,
              color: view === item.id ? T.gold : T.goldBorder,
              fontFamily: 'Georgia, serif',
            }}>
              {item.label.toUpperCase()}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}