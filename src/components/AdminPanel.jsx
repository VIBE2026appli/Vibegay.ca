import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = {
  gold: '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
  error: '#FF6B6B',
  success: '#4CAF50',
  panel: 'rgba(10,10,10,0.95)',
};

const STATUSES = {
  available: '🟢 Disponible',
  reserved:  '🟡 Réservé',
  issued:    '🔵 Émis',
  redeemed:  '✅ Utilisé',
  cancelled: '❌ Annulé',
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: T.gold, letterSpacing: 3, fontSize: 14, margin: '0 0 16px', fontWeight: 400 }}>
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      background: 'rgba(212,175,55,0.1)', border: `1px solid ${color || T.goldBorder}`,
      color: color || T.gold, padding: '2px 10px', borderRadius: 12, fontSize: 11, letterSpacing: 1,
    }}>
      {label}
    </span>
  );
}

function IssueCompForm({ eventId, onIssued }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const submit = async () => {
    if (!email) { setMsg('E-mail requis.'); setIsErr(true); return; }
    setLoading(true); setMsg('');
    // Look up the holder's user id by email (via admin-safe lookup in profiles)
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const { data, error } = await supabase.rpc('issue_comp_ticket', {
      p_event_id: eventId,
      p_holder_id: prof?.id ?? null,
      p_holder_email: email,
      p_note: note || null,
    });
    setLoading(false);
    if (error) { setMsg(error.message); setIsErr(true); }
    else { setMsg('Billet gratuit émis !'); setIsErr(false); setEmail(''); setNote(''); onIssued && onIssued(data); }
  };

  const inp = {
    background: 'transparent', border: 'none',
    borderBottom: `1px solid ${T.goldBorder}`,
    color: T.text, width: '100%', padding: '8px 0',
    outline: 'none', fontSize: 13, fontFamily: 'Georgia, serif',
    marginBottom: 12, boxSizing: 'border-box',
  };

  return (
    <div style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '16px 20px' }}>
      <p style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 1, margin: '0 0 12px' }}>ÉMETTRE UN BILLET GRATUIT</p>
      <label style={{ color: T.goldBorder, fontSize: 10, letterSpacing: 1 }}>E-MAIL DU DESTINATAIRE</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} disabled={loading} aria-label="E-mail du destinataire" />
      <label style={{ color: T.goldBorder, fontSize: 10, letterSpacing: 1 }}>RAISON / NOTE (FACULTATIF)</label>
      <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inp} disabled={loading} aria-label="Raison ou note" />
      <button onClick={submit} disabled={loading} style={{
        marginTop: 4, padding: '8px 20px', background: 'rgba(212,175,55,0.12)',
        border: `1px solid ${T.gold}`, color: T.gold, cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 11, letterSpacing: 2, fontFamily: 'Georgia, serif', borderRadius: 4,
      }}>
        {loading ? '…' : 'ÉMETTRE'}
      </button>
      {msg && <p style={{ marginTop: 10, color: isErr ? T.error : T.success, fontSize: 12 }}>{msg}</p>}
    </div>
  );
}

function TicketRow({ ticket, isAdmin, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus) => {
    setLoading(true);
    const patch = { status: newStatus };
    if (newStatus === 'redeemed') patch.redeemed_at = new Date().toISOString();
    if (newStatus === 'cancelled') patch.cancelled_at = new Date().toISOString();
    await supabase.from('tickets').update(patch).eq('id', ticket.id);
    setLoading(false);
    onStatusChange && onStatusChange();
  };

  return (
    <tr>
      <td style={{ padding: '10px 8px', color: T.text, fontSize: 12 }}>
        {ticket.holder_email || ticket.holder_id?.slice(0,8) + '…'}
      </td>
      <td style={{ padding: '10px 8px' }}>
        <Pill label={ticket.ticket_type === 'complimentary' ? 'Gratuit' : 'Standard'} />
      </td>
      <td style={{ padding: '10px 8px', color: T.goldBorder, fontSize: 12 }}>
        {STATUSES[ticket.status] || ticket.status}
      </td>
      <td style={{ padding: '10px 8px', color: T.goldBorder, fontSize: 11 }}>
        {ticket.issued_at ? new Date(ticket.issued_at).toLocaleDateString('fr-CA') : '—'}
      </td>
      <td style={{ padding: '10px 8px', color: T.goldBorder, fontSize: 11 }}>
        {ticket.holder_note || '—'}
      </td>
      {isAdmin && (
        <td style={{ padding: '10px 8px' }}>
          {ticket.status === 'issued' && (
            <>
              <button onClick={() => updateStatus('redeemed')} disabled={loading}
                style={{ marginRight: 6, background: 'transparent', border: `1px solid ${T.success}`, color: T.success, padding: '2px 8px', cursor: 'pointer', fontSize: 10, borderRadius: 3, fontFamily: 'Georgia, serif' }}>
                Utiliser
              </button>
              <button onClick={() => updateStatus('cancelled')} disabled={loading}
                style={{ background: 'transparent', border: `1px solid ${T.error}`, color: T.error, padding: '2px 8px', cursor: 'pointer', fontSize: 10, borderRadius: 3, fontFamily: 'Georgia, serif' }}>
                Annuler
              </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
}

export default function AdminPanel({ profile }) {
  const isAdmin   = profile?.role === 'admin';
  const isCoAdmin = profile?.role === 'co_admin';
  const canAccess = isAdmin || isCoAdmin;

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0); // refresh trigger

  useEffect(() => {
    if (!canAccess) return;
    setLoadingData(true);

    Promise.all([
      supabase.from('events').select('*').eq('slug','vibe-qbc-2026').single(),
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('comp_allocation').select('*').eq('event_id',
        supabase.from('events').select('id').eq('slug','vibe-qbc-2026').single()
      ),
      isAdmin
        ? supabase.from('profiles').select('id,email,role,display_name,created_at').order('created_at')
        : Promise.resolve({ data: [], error: null }),
    ]).then(([evRes, tkRes, allocRes, usersRes]) => {
      if (evRes.error) setError(evRes.error.message);
      setEvent(evRes.data);
      setTickets(tkRes.data || []);
      setUsers(usersRes.data || []);
      // Fetch allocation separately using event id
      if (evRes.data) {
        supabase.from('comp_allocation').select('*').eq('event_id', evRes.data.id).single()
          .then(({ data }) => setAllocation(data));
      }
      setLoadingData(false);
    });
  }, [canAccess, isAdmin, tick]);

  if (!canAccess) {
    return (
      <div style={{ minHeight: '100vh', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <p style={{ color: T.error, letterSpacing: 2, fontSize: 14 }}>ACCÈS REFUSÉ — Rôle insuffisant</p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <p style={{ color: T.gold, letterSpacing: 4 }}>CHARGEMENT…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <p style={{ color: T.error, fontSize: 14 }}>Erreur : {error}</p>
      </div>
    );
  }

  const compTickets = tickets.filter(t => t.ticket_type === 'complimentary');
  const remaining   = allocation ? allocation.total_alloc - allocation.issued_count : '—';

  return (
    <div style={{ minHeight: '100vh', background: T.dark, fontFamily: 'Georgia, serif', padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: T.gold, letterSpacing: 6, fontWeight: 400, fontSize: 20, marginBottom: 8 }}>PANNEAU D'ADMINISTRATION</h2>
      <p style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 2, marginBottom: 32 }}>
        RÔLE : {profile.role.toUpperCase()}
        {!isAdmin && ' — Accès paiements/finances désactivé'}
      </p>

      {/* Allocation summary */}
      <Section title="Allocation billets gratuits — Vibe QBC 2026">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            ['Allocation totale', allocation?.total_alloc ?? '…'],
            ['Émis',              allocation?.issued_count ?? '…'],
            ['Restants',          remaining],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '14px 22px', textAlign: 'center' }}>
              <div style={{ color: T.gold, fontSize: 24, fontWeight: 400 }}>{val}</div>
              <div style={{ color: T.goldBorder, fontSize: 10, letterSpacing: 2, marginTop: 4 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
        {event && <IssueCompForm eventId={event.id} onIssued={() => setTick(t => t + 1)} />}
      </Section>

      {/* Comp tickets table */}
      <Section title="Billets gratuits émis">
        {compTickets.length === 0
          ? <p style={{ color: T.goldBorder, fontSize: 12 }}>Aucun billet gratuit émis.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.goldBorder}` }}>
                    {['Destinataire','Type','Statut','Date d\'émission','Note','Actions'].map(h => (
                      <th key={h} style={{ padding: '8px', color: T.goldBorder, fontWeight: 400, textAlign: 'left', letterSpacing: 1, fontSize: 10 }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compTickets.map(t => (
                    <TicketRow key={t.id} ticket={t} isAdmin onStatusChange={() => setTick(n => n + 1)} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Section>

      {/* User role management (admin only) */}
      {isAdmin && (
        <Section title="Gestion des rôles (admin seulement)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.goldBorder}` }}>
                  {['E-mail','Nom','Rôle','Inscrit le'].map(h => (
                    <th key={h} style={{ padding: '8px', color: T.goldBorder, fontWeight: 400, textAlign: 'left', letterSpacing: 1, fontSize: 10 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <UserRoleRow key={u.id} user={u} onChanged={() => setTick(n => n + 1)} />
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function UserRoleRow({ user, onChanged }) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ role }).eq('id', user.id);
    // Audit log entry
    await supabase.from('audit_log').insert({
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action: 'change_role',
      entity_type: 'profile',
      entity_id: user.id,
      detail: { new_role: role, target_email: user.email },
    });
    setSaving(false);
    onChanged && onChanged();
  };

  return (
    <tr style={{ borderBottom: `1px solid rgba(212,175,55,0.1)` }}>
      <td style={{ padding: '10px 8px', color: '#EAE0C8', fontSize: 12 }}>{user.email}</td>
      <td style={{ padding: '10px 8px', color: '#EAE0C8', fontSize: 12 }}>{user.display_name || '—'}</td>
      <td style={{ padding: '10px 8px' }}>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ background: '#111', border: `1px solid rgba(212,175,55,0.4)`, color: '#D4AF37', padding: '4px 8px', fontFamily: 'Georgia, serif', fontSize: 11, borderRadius: 3 }}>
          <option value="attendee">attendee</option>
          <option value="co_admin">co_admin</option>
          <option value="admin">admin</option>
        </select>
        {role !== user.role && (
          <button onClick={save} disabled={saving}
            style={{ marginLeft: 8, background: 'transparent', border: `1px solid #D4AF37`, color: '#D4AF37', padding: '3px 10px', cursor: 'pointer', fontSize: 10, borderRadius: 3, fontFamily: 'Georgia, serif' }}>
            {saving ? '…' : 'Sauver'}
          </button>
        )}
      </td>
      <td style={{ padding: '10px 8px', color: 'rgba(212,175,55,0.4)', fontSize: 11 }}>
        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-CA') : '—'}
      </td>
    </tr>
  );
}
