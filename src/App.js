import React, { useState } from "react";

// ⚡ Bolt: Extracted static constants out of the component to prevent recreating them on every render
// Expected impact: Minor reduction in memory allocation and GC overhead during typing/hovering
const cities = [
  { name: 'MONTRÉAL', url: 'https://vibegay.ca/montreal' },
  { name: 'QUÉBEC',   url: 'https://vibegay.ca/quebec'   },
  { name: 'OTTAWA',   url: 'https://vibegay.ca/ottawa'   },
  { name: 'TORONTO',  url: 'https://vibegay.ca/toronto'  }
];

const gold = '#D4AF37';
const goldDim = 'rgba(212,175,55,0.15)';
const goldBorder = 'rgba(212,175,55,0.6)';
const sparkles = [[88,85],[12,20],[90,15],[5,70]];

export default function App() {
  const [prenom, setPrenom] = useState('');
  const [hover, setHover] = useState(null);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      overflow: 'hidden',
    }}>

      {/* Glow blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-15%',
        width: '55%', height: '70%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(80,40,160,0.55) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '50%', height: '60%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,130,20,0.3) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', top: '20%', right: '5%',
        width: '35%', height: '50%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(40,80,180,0.35) 0%, transparent 70%)',
        filter: 'blur(35px)', pointerEvents: 'none'
      }}/>

      {/* Phone mockup */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: 260,
        background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
        borderRadius: 36,
        border: '2px solid rgba(212,175,55,0.25)',
        boxShadow: `
          0 0 0 1px rgba(0,0,0,0.8),
          0 30px 80px rgba(0,0,0,0.9),
          0 0 40px rgba(212,175,55,0.08),
          inset 0 1px 0 rgba(255,255,255,0.05)
        `,
        padding: '28px 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Notch */}
        <div style={{
          width: 80, height: 6, borderRadius: 3,
          background: '#222', marginBottom: 24,
        }}/>

        {/* VIBE title */}
        <h1 style={{
          margin: '0 0 6px',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: 10,
          color: gold,
          textShadow: `0 0 20px rgba(212,175,55,0.5)`,
        }}>
          V I B E
        </h1>

        {/* Gold line */}
        <div style={{
          width: '100%', height: 1,
          background: `linear-gradient(to right, transparent, ${goldBorder}, transparent)`,
          marginBottom: 20,
        }}/>

        {/* City grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          width: '100%',
          marginBottom: 24,
        }}>
          {cities.map(city => (
            <a
              key={city.name}
              href={city.url}
              onMouseEnter={() => setHover(city.name)}
              onMouseLeave={() => setHover(null)}
              style={{
                border: `1px solid ${hover === city.name ? gold : goldBorder}`,
                padding: '14px 8px',
                textDecoration: 'none',
                color: gold,
                textAlign: 'center',
                fontSize: 11,
                letterSpacing: 2,
                borderRadius: 2,
                background: hover === city.name ? goldDim : 'transparent',
                transition: 'all 0.25s ease',
                display: 'block',
                boxShadow: hover === city.name ? `0 0 12px rgba(212,175,55,0.2)` : 'none',
              }}
            >
              {city.name}
            </a>
          ))}
        </div>

        {/* Gold line */}
        <div style={{
          width: '100%', height: 1,
          background: `linear-gradient(to right, transparent, ${goldBorder}, transparent)`,
          marginBottom: 20,
        }}/>

        {/* Prénom input */}
        <div style={{ width: '100%', position: 'relative' }}>
          <input
            type="text"
            placeholder="Votre Prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${goldBorder}`,
              color: gold,
              width: '100%',
              padding: '8px 0',
              outline: 'none',
              fontSize: 12,
              letterSpacing: 2,
              fontFamily: 'Georgia, serif',
            }}
          />
          <div style={{
            position: 'absolute', right: 0, bottom: 8,
            color: goldBorder, fontSize: 14,
          }}>→</div>
        </div>
      </div>

      {/* Sparkles */}
      {sparkles.map(([x,y],i) => (
        <div key={i} style={{
          position:'absolute', left:`${x}%`, top:`${y}%`,
          color: gold, fontSize: i===0?20:12, opacity: 0.6,
          pointerEvents:'none', zIndex:5,
          textShadow:`0 0 8px ${gold}`
        }}>✦</div>
      ))}

    </div>
  );
}