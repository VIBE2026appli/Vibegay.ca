import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ALLOWED_EMAILS = ['vibeqbc412@hotmail.com'];

export default function MagicLogin() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      setLoggedIn(true);
      setUserEmail(session.user.email);
      setMessage('Connecté en tant que ' + session.user.email);
      setIsError(false);
    }
    if (event === 'SIGNED_OUT') {
      setLoggedIn(false);
      setUserEmail('');
    }
  });

  const sendMagicLink = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) { setIsError(true); setMessage('Entrez une adresse e-mail.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) { setIsError(true); setMessage('Adresse e-mail invalide.'); return; }
    if (!ALLOWED_EMAILS.includes(normalized)) { setIsError(true); setMessage("Cette adresse n'est pas autorisée."); return; }

    setLoading(true);
    setMessage('Envoi du lien...');
    setIsError(false);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: window.location.origin }
    });

    setLoading(false);
    if (error) { setIsError(true); setMessage('Erreur : ' + error.message); }
    else { setIsError(false); setMessage('Lien envoyé ! Vérifie ta boîte e-mail (et les spams).'); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMessage('Déconnecté.');
    setIsError(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: '1rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Connexion sans mot de passe</h2>
      {!loggedIn ? (
        <>
          <input
            type="email"
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
            disabled={loading}
          />
          <button
            onClick={sendMagicLink}
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Envoi...' : 'Recevoir le lien de connexion'}
          </button>
        </>
      ) : (
        <div>
          <p style={{ fontWeight: 'bold' }}>Connecté : {userEmail}</p>
          <button onClick={signOut} style={{ padding: '0.4rem 1rem', cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      )}
      {message && (
        <p style={{ marginTop: '0.5rem', color: isError ? '#b00020' : '#0b6' }}>{message}</p>
      )}
    </div>
  );
}
