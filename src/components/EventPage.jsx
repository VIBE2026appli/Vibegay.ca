import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = {
  gold: '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
  error: '#FF6B6B',
  success: '#4CAF50',
};

const STATUS_LABEL = {
  available: '🟢 Disponible',
  reserved:  '🟡 Réservé',
  issued:    '🔵 Émis',
  redeemed:  '✅ Utilisé',
  cancelled: '❌ Annulé',
};

export default function EventPage({ user }) {
  const [event, setEvent]     = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from('events').select('*').eq('slug','vibe-qbc-2026').single(),
      user
        ? supabase.from('tickets').select('*').eq('holder_id', user.id)
        : Promise.resolve({ data: [], error: null }),
    ]).then(([evRes, tkRes]) => {
      if (cancelled) return;
      if (evRes.error) setError(evRes.error.message);
      else setEvent(evRes.data);
      setTickets(tkRes.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <p style={{ color: T.gold, letterSpacing: 4 }}>CHARGEMENT…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <p style={{ color: T.error, fontSize: 14 }}>Impossible de charger l'événement. Réessaie plus tard.</p>
      </div>
    );
  }

  const fmt = iso => iso ? new Date(iso).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' }) : '—';

  return (
    <div style={{ minHeight: '100vh', background: T.dark, fontFamily: 'Georgia, serif', padding: '32px 16px', maxWidth: 700, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: T.gold, letterSpacing: 8, fontWeight: 400, fontSize: 28, margin: 0 }}>
          {event.name}
        </h1>
        <p style={{ color: T.goldBorder, letterSpacing: 2, marginTop: 8, fontSize: 13 }}>
          {event.location}
        </p>
        <p style={{ color: T.text, fontSize: 13, marginTop: 6 }}>
          {fmt(event.starts_at)} — {fmt(event.ends_at)}
        </p>
        <p style={{ color: T.text, fontSize: 14, marginTop: 16, lineHeight: 1.6 }}>
          {event.description}
        </p>
      </div>

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.goldBorder}, transparent)`, margin: '32px 0' }} />

      {/* Tickets section */}
      <h2 style={{ color: T.gold, letterSpacing: 4, fontWeight: 400, fontSize: 16, marginBottom: 16 }}>
        MES BILLETS
      </h2>

      {!user && (
        <p style={{ color: T.goldBorder, fontSize: 13 }}>
          Connecte-toi pour voir tes billets.
        </p>
      )}

      {user && tickets.length === 0 && (
        <p style={{ color: T.goldBorder, fontSize: 13 }}>
          Tu n'as pas encore de billet pour cet événement.
        </p>
      )}

      {tickets.map(t => (
        <div key={t.id} style={{
          border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: '16px 20px',
          marginBottom: 14, background: 'rgba(212,175,55,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ color: T.gold, fontSize: 13, letterSpacing: 2 }}>
                {t.ticket_type === 'complimentary' ? '★ BILLET GRATUIT OFFICIEL' : 'BILLET STANDARD'}
              </span>
            </div>
            <span style={{ color: T.goldBorder, fontSize: 12 }}>
              {STATUS_LABEL[t.status] || t.status}
            </span>
          </div>
          <div style={{ color: T.goldBorder, fontSize: 11, marginTop: 8, letterSpacing: 1 }}>
            ID : {t.id.slice(0, 8).toUpperCase()}
            {t.issued_at && <> · Émis le {new Date(t.issued_at).toLocaleDateString('fr-CA')}</>}
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.goldBorder}, transparent)`, margin: '32px 0' }} />

      {/* Ticket info notice */}
      <p style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 1, lineHeight: 1.7 }}>
        Les billets payants ne sont pas encore disponibles. La billetterie ouvre prochainement.
        Les billets gratuits officiels sont attribués sur invitation par l'équipe VIBE.
      </p>
    </div>
  );
}
