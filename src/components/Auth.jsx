import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
  error: '#FF6B6B',
  success: '#4CAF50',
};

function genAnonName() {
  return 'Anon' + Math.floor(1000 + Math.random() * 9000);
}

export default function Auth({ onAuth }) {
  const [tab, setTab] = useState('connexion');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const msg = (text, err = false) => { setMessage(text); setIsError(err); };

  const handleSubmit = async () => {
    if (!email || !password) { msg('Remplis tous les champs.', true); return; }
    setLoading(true);
    msg('');
    if (tab === 'connexion') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { msg(error.message, true); }
      else {
        localStorage.setItem('vibe_displayName', data.user.email.split('@')[0]);
        localStorage.setItem('vibe_isGuest', 'false');
        onAuth({ user: data.user, displayName: data.user.email.split('@')[0], isGuest: false });
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { msg(error.message, true); }
      else if (data.user && !data.user.confirmed_at) {
        msg('Compte créé ! Vérifie ton e-mail pour confirmer.', false);
      } else {
        localStorage.setItem('vibe_displayName', data.user.email.split('@')[0]);
        localStorage.setItem('vibe_isGuest', 'false');
        onAuth({ user: data.user, displayName: data.user.email.split('@')[0], isGuest: false });
      }
    }
    setLoading(false);
  };

  const handleAnon = () => {
    const name = genAnonName();
    localStorage.setItem('vibe_displayName', name);
    localStorage.setItem('vibe_isGuest', 'true');
    onAuth({ user: null, displayName: name, isGuest: true });
  };

  const inputStyle = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${T.goldBorder}`,
    color: T.text,
    width: '100%',
    padding: '10px 0',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'Georgia, serif',
    marginBottom: 16,
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.dark,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        width: 320, padding: '32px 28px',
        border: `1px solid ${T.goldBorder}`,
        borderRadius: 20,
        background: 'rgba(10,10,10,0.95)',
        boxShadow: `0 0 40px rgba(212,175,55,0.08)`,
      }}>
        <h2 style={{ color: T.gold, letterSpacing: 8, textAlign: 'center', margin: '0 0 24px', fontWeight: 400, fontSize: 22 }}>
          V I B E
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: `1px solid ${T.goldBorder}` }}>
          {['connexion', 'inscription'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: 'none', border: 'none',
              color: tab === t ? T.gold : T.goldBorder,
              cursor: 'pointer', padding: '8px 0',
              fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              borderBottom: tab === t ? `2px solid ${T.gold}` : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t === 'connexion' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        <label style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 2 }}>E-MAIL</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />

        <label style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 2 }}>MOT DE PASSE</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
          disabled={loading}
        />

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '12px', marginTop: 8,
          background: T.goldDim, border: `1px solid ${T.gold}`,
          color: T.gold, cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12, letterSpacing: 3, fontFamily: 'Georgia, serif',
          borderRadius: 4, transition: 'all 0.2s',
        }}>
          {loading ? '...' : (tab === 'connexion' ? 'CONNEXION' : 'CRÉER UN COMPTE')}
        </button>

        <div style={{ textAlign: 'center', margin: '16px 0 4px', color: T.goldBorder, fontSize: 11 }}>— ou —</div>

        <button onClick={handleAnon} style={{
          width: '100%', padding: '10px',
          background: 'transparent', border: `1px solid ${T.goldBorder}`,
          color: T.goldBorder, cursor: 'pointer',
          fontSize: 11, letterSpacing: 2, fontFamily: 'Georgia, serif',
          borderRadius: 4,
        }}>
          CONTINUER EN ANONYME
        </button>

        {message && (
          <p style={{ marginTop: 14, color: isError ? T.error : T.success, fontSize: 13, textAlign: 'center' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
