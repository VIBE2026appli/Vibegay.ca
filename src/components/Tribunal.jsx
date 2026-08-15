import { useState, useEffect, useRef } from 'react';
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

const MOTIFS = [
  'Harcèlement', 'Discours haineux', 'Comportement abusif',
  'Spam / publicité', 'Usurpation d\'identité', 'Autre',
];

export default function Tribunal({ displayName }) {
  const [signalements, setSignalements] = useState([]);
  const [pseudoReporte, setPseudoReporte] = useState('');
  const [motif, setMotif] = useState(MOTIFS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loadError, setLoadError] = useState('');
  const intervalRef = useRef(null);

  const fetchSignalements = async () => {
    const { data, error } = await supabase
      .from('tribunal_signalements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) setLoadError('Impossible de charger les signalements.');
    if (error) setSignalements([]);
    else setLoadError('');
    if (data) setSignalements(data);
  };

  useEffect(() => {
    fetchSignalements();
    intervalRef.current = setInterval(fetchSignalements, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSignal = async () => {
    if (!pseudoReporte.trim()) {
      setIsError(true); setMessage('Entrez le pseudo à signaler.'); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('tribunal_signalements').insert({
      pseudo_reporter: displayName || 'Anonyme',
      pseudo_reporte: pseudoReporte.trim(),
      motif,
      votes_coupable: 0,
      votes_innocent: 0,
      statut: 'en_cours',
    });
    setSubmitting(false);
    if (error) { setIsError(true); setMessage(error.message); }
    else { setIsError(false); setMessage('Signalement envoyé.'); setPseudoReporte(''); fetchSignalements(); }
  };

  const vote = async (id, verdict) => {
    const { error } = await supabase.rpc('vote_tribunal', { p_id: id, p_verdict: verdict });
    if (!error) fetchSignalements();
  };

  const totalVotes = (s) => (s.votes_coupable || 0) + (s.votes_innocent || 0);
  const pctCoupable = (s) => {
    const t = totalVotes(s);
    return t === 0 ? 0 : Math.round((s.votes_coupable / t) * 100);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.dark, color: T.text, fontFamily: 'Georgia, serif', padding: '24px 16px' }}>
      <h2 style={{ color: T.gold, letterSpacing: 6, fontWeight: 400, margin: '0 0 24px', textAlign: 'center' }}>
        TRIBUNAL
      </h2>

      {/* Signalement form */}
      <form onSubmit={e => { e.preventDefault(); handleSignal(); }} style={{
        maxWidth: 480, margin: '0 auto 28px', padding: '20px',
        border: `1px solid ${T.goldBorder}`, borderRadius: 10,
        background: 'rgba(10,10,10,0.9)',
      }}>
        <h3 style={{ color: T.gold, fontWeight: 400, letterSpacing: 2, fontSize: 13, margin: '0 0 16px' }}>
          SIGNALER UN UTILISATEUR
        </h3>

        <label htmlFor="pseudo-reporte" style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 2 }}>PSEUDO À SIGNALER</label>
        <input
          id="pseudo-reporte"
          value={pseudoReporte}
          onChange={e => setPseudoReporte(e.target.value)}
          placeholder="pseudo"
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            background: 'transparent', border: 'none',
            borderBottom: `1px solid ${T.goldBorder}`,
            color: T.text, padding: '8px 0', outline: 'none',
            fontSize: 14, fontFamily: 'Georgia, serif', marginBottom: 16,
          }}
        />

        <label htmlFor="motif-reporte" style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 2 }}>MOTIF</label>
        <select id="motif-reporte" value={motif} onChange={e => setMotif(e.target.value)} style={{
          display: 'block', width: '100%', marginTop: 6, marginBottom: 16,
          background: T.dark, border: `1px solid ${T.goldBorder}`,
          color: T.text, padding: '8px', fontSize: 13, fontFamily: 'Georgia, serif',
          borderRadius: 4, outline: 'none',
        }}>
          {MOTIFS.map(m => <option key={m}>{m}</option>)}
        </select>

        <button type="submit" disabled={submitting} style={{
          width: '100%', padding: '10px',
          background: T.goldDim, border: `1px solid ${T.gold}`,
          color: T.gold, cursor: submitting ? 'not-allowed' : 'pointer',
          fontSize: 11, letterSpacing: 3, fontFamily: 'Georgia, serif', borderRadius: 4,
        }}>
          {submitting ? '...' : 'ENVOYER LE SIGNALEMENT'}
        </button>

        {message && (
          <p role={isError ? 'alert' : 'status'} style={{ marginTop: 10, color: isError ? T.error : T.success, fontSize: 13 }}>{message}</p>
        )}
      </form>

      {/* Signalements list */}
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loadError && <p role="alert" style={{ textAlign: 'center', color: T.error }}>{loadError}</p>}
        {signalements.map(s => {
          const total = totalVotes(s);
          const pct = pctCoupable(s);
          return (
            <div key={s.id} style={{
              padding: '16px', border: `1px solid ${T.goldBorder}`,
              borderRadius: 10, background: 'rgba(10,10,10,0.9)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ color: T.gold, fontSize: 13 }}>{s.pseudo_reporte}</span>
                  <span style={{ color: T.goldBorder, fontSize: 11, marginLeft: 8 }}>· {s.motif}</span>
                </div>
                <span style={{
                  fontSize: 10, letterSpacing: 1, padding: '2px 8px', borderRadius: 10,
                  background: s.statut === 'coupable' ? 'rgba(255,107,107,0.2)' : s.statut === 'innocent' ? 'rgba(76,175,80,0.2)' : T.goldDim,
                  color: s.statut === 'coupable' ? T.error : s.statut === 'innocent' ? T.success : T.gold,
                }}>
                  {s.statut.replace('_', ' ')}
                </span>
              </div>

              {/* Vote bars */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.goldBorder, marginBottom: 3 }}>
                  <span>Coupable {pct}%</span>
                  <span>Innocent {100 - pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(76,175,80,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: T.error, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <div style={{ color: T.goldBorder, fontSize: 10, marginTop: 4 }}>{total} vote{total !== 1 ? 's' : ''}</div>
              </div>

              {/* Vote buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => vote(s.id, 'coupable')} style={{
                  flex: 1, padding: '6px', background: 'rgba(255,107,107,0.1)',
                  border: `1px solid ${T.error}`, color: T.error,
                  cursor: 'pointer', fontSize: 11, letterSpacing: 1, borderRadius: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  ✗ COUPABLE
                </button>
                <button onClick={() => vote(s.id, 'innocent')} style={{
                  flex: 1, padding: '6px', background: 'rgba(76,175,80,0.1)',
                  border: `1px solid ${T.success}`, color: T.success,
                  cursor: 'pointer', fontSize: 11, letterSpacing: 1, borderRadius: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  ✓ INNOCENT
                </button>
              </div>
            </div>
          );
        })}
        {signalements.length === 0 && (
          <p style={{ textAlign: 'center', color: T.goldBorder }}>Aucun signalement en cours.</p>
        )}
      </div>
    </div>
  );
}
