import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
};

export default function TextRoom({ salon, displayName, city, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  const addMessage = (msg) => {
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    // Initial load
    supabase
      .from('salon_messages')
      .select('*')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) data.forEach(m => { seenIds.current.add(m.id); });
        setMessages(data || []);
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`salon_messages:${salon.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'salon_messages',
        filter: `salon_id=eq.${salon.id}`,
      }, (payload) => {
        addMessage(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [salon.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    // Optimistic insert
    const optimistic = {
      id: `opt-${Date.now()}`,
      salon_id: salon.id,
      prenom: displayName,
      ville: city || '',
      message: text,
      created_at: new Date().toISOString(),
    };
    seenIds.current.add(optimistic.id);
    setMessages(prev => [...prev, optimistic]);

    const { data, error } = await supabase.from('salon_messages').insert({
      salon_id: salon.id,
      prenom: displayName,
      ville: city || '',
      message: text,
    }).select().single();

    if (!error && data) {
      // Replace optimistic with real row
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
      seenIds.current.delete(optimistic.id);
      seenIds.current.add(data.id);
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.dark, fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.gold, cursor: 'pointer', fontSize: 18 }}>←</button>
        <div>
          <div style={{ color: T.gold, letterSpacing: 2, fontSize: 14 }}>{salon.name}</div>
          <div style={{ color: T.goldBorder, fontSize: 11 }}>{salon.city} · {salon.category}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ color: T.goldBorder, textAlign: 'center' }}>Chargement…</p>
        ) : messages.length === 0 ? (
          <p style={{ color: T.goldBorder, textAlign: 'center' }}>Aucun message — sois le premier !</p>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ maxWidth: '80%', alignSelf: m.prenom === displayName ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 10, color: T.goldBorder, marginBottom: 3, textAlign: m.prenom === displayName ? 'right' : 'left' }}>
                {m.prenom}{m.ville ? ` · ${m.ville}` : ''} · {formatTime(m.created_at)}
              </div>
              <div style={{
                background: m.prenom === displayName ? T.goldDim : 'rgba(30,30,30,0.9)',
                border: `1px solid ${m.prenom === displayName ? T.gold : T.goldBorder}`,
                borderRadius: 10, padding: '8px 12px',
                color: T.text, fontSize: 14, lineHeight: 1.5,
              }}>
                {m.message}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.goldBorder}`, display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message…"
          style={{
            flex: 1, background: 'transparent', border: `1px solid ${T.goldBorder}`,
            borderRadius: 20, padding: '10px 16px',
            color: T.text, fontSize: 14, outline: 'none', fontFamily: 'Georgia, serif',
          }}
        />
        <button onClick={sendMessage} style={{
          background: T.goldDim, border: `1px solid ${T.gold}`,
          color: T.gold, padding: '10px 18px', borderRadius: 20,
          cursor: 'pointer', fontSize: 16,
        }}>→</button>
      </div>
    </div>
  );
}
