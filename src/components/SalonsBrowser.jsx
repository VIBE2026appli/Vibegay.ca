import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TextRoom from './TextRoom';

const CATEGORIES = ['tous', 'gay', 'bi', 'lesbienne', 'trans', 'alliee', 'mixte'];

const T = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
};

export default function SalonsBrowser({ displayName, city }) {
  const [salons, setSalons] = useState([]);
  const [category, setCategory] = useState('tous');
  const [activeSalon, setActiveSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);
      let query = supabase.from('salons').select('*').eq('format', 'texte');
      if (category !== 'tous') query = query.eq('category', category);
      const { data } = await query.order('name');
      setSalons(data || []);
      setLoading(false);
    };
    fetchSalons();
  }, [category]);

  if (activeSalon) {
    return (
      <TextRoom
        salon={activeSalon}
        displayName={displayName}
        city={city}
        onBack={() => setActiveSalon(null)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.dark, color: T.text, fontFamily: 'Georgia, serif', padding: '24px 16px' }}>
      <h2 style={{ color: T.gold, letterSpacing: 6, fontWeight: 400, margin: '0 0 20px', textAlign: 'center' }}>
        SALONS TEXTE
      </h2>

      {/* Category filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            background: category === cat ? T.goldDim : 'transparent',
            border: `1px solid ${category === cat ? T.gold : T.goldBorder}`,
            color: category === cat ? T.gold : T.goldBorder,
            padding: '6px 14px', borderRadius: 20,
            cursor: 'pointer', fontSize: 11, letterSpacing: 2,
            textTransform: 'uppercase', fontFamily: 'Georgia, serif',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: T.goldBorder }}>Chargement…</p>
      ) : salons.length === 0 ? (
        <p style={{ textAlign: 'center', color: T.goldBorder }}>Aucun salon dans cette catégorie.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12, maxWidth: 480, margin: '0 auto' }}>
          {salons.map(salon => (
            <button key={salon.id} onClick={() => setActiveSalon(salon)} style={{
              background: 'rgba(20,20,20,0.9)',
              border: `1px solid ${T.goldBorder}`,
              borderRadius: 10, padding: '16px 20px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.goldBorder}
            >
              <div style={{ color: T.gold, fontSize: 14, letterSpacing: 2, marginBottom: 4 }}>
                {salon.name}
              </div>
              <div style={{ color: T.goldBorder, fontSize: 11, letterSpacing: 1 }}>
                {salon.city} · {salon.category}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
