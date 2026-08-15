import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
};

const IDENTITIES = ['Tous', 'Gay', 'Bi', 'Lesbienne', 'Trans', 'Allié·e', 'Mixte'];
const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const VAD_THRESHOLD = 18;

function useVAD(stream) {
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setSpeaking(avg > VAD_THRESHOLD);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      src.disconnect();
      ctx.close();
    };
  }, [stream]);
  return speaking;
}

export default function VoiceRoom({ displayName, city, identity }) {
  const [participants, setParticipants] = useState({});
  const [muted, setMuted] = useState(true);
  const [listenFilter, setListenFilter] = useState('Tous');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const localStreamRef = useRef(null);
  const [localStreamState, setLocalStreamState] = useState(null);
  const peers = useRef({});        // peerId → { pc, stream }
  const audioRefs = useRef({});    // peerId → <audio>
  const channelRef = useRef(null);
  const userId = useRef(displayName + '-' + crypto.randomUUID().slice(0, 8));

  // localStreamState triggers re-render so useVAD receives the real stream
  const localSpeaking = useVAD(localStreamState);

  const applyFilter = useCallback((peerId, stream) => {
    const el = audioRefs.current[peerId];
    if (!el || !stream) return;
    const pInfo = Object.values(participants).find(p => p.userId === peerId);
    const pIdentity = pInfo?.identity || 'Mixte';
    const blocked = listenFilter !== 'Tous' && pIdentity.toLowerCase() !== listenFilter.toLowerCase();
    el.srcObject = stream;
    el.muted = blocked;
  }, [listenFilter, participants]);

  // Reapply filter whenever it changes
  useEffect(() => {
    Object.entries(peers.current).forEach(([peerId, { stream }]) => {
      if (stream) applyFilter(peerId, stream);
    });
  }, [listenFilter, applyFilter]);

  const createPeer = useCallback((peerId, polite) => {
    const pc = new RTCPeerConnection(STUN);

    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!peers.current[peerId]) peers.current[peerId] = { pc, stream };
      else peers.current[peerId].stream = stream;
      applyFilter(peerId, stream);
    };

    let makingOffer = false;
    let ignoreOffer = false;

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await pc.setLocalDescription();
        channelRef.current?.send({
          type: 'broadcast', event: 'signal',
          payload: { to: peerId, from: userId.current, desc: pc.localDescription },
        });
      } catch (e) { console.error(e); }
      finally { makingOffer = false; }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      channelRef.current?.send({
        type: 'broadcast', event: 'signal',
        payload: { to: peerId, from: userId.current, candidate },
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
    };

    peers.current[peerId] = { pc, stream: null, makingOffer: () => makingOffer, ignoreOffer: (v) => { ignoreOffer = v; }, getIgnoreOffer: () => ignoreOffer, polite };
    return pc;
  }, [applyFilter]);

  const handleSignal = useCallback(async ({ to, from, desc, candidate }) => {
    if (to !== userId.current) return;
    const peerId = from;
    let entry = peers.current[peerId];
    if (!entry) {
      const polite = userId.current > peerId;
      createPeer(peerId, polite);
      entry = peers.current[peerId];
    }
    const { pc } = entry;

    try {
      if (desc) {
        const offerCollision = desc.type === 'offer' && (entry.makingOffer() || pc.signalingState !== 'stable');
        const shouldIgnore = !entry.polite && offerCollision;
        if (shouldIgnore) return;
        await pc.setRemoteDescription(desc);
        if (desc.type === 'offer') {
          await pc.setLocalDescription();
          channelRef.current?.send({
            type: 'broadcast', event: 'signal',
            payload: { to: peerId, from: userId.current, desc: pc.localDescription },
          });
        }
      } else if (candidate) {
        await pc.addIceCandidate(candidate).catch(() => {});
      }
    } catch (e) { console.error(e); }
  }, [createPeer]);

  const joinRoom = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = false; }); // start muted
      localStreamRef.current = stream;
      setLocalStreamState(stream);

      const channel = supabase.channel('voix-global', {
        config: { presence: { key: userId.current } },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const map = {};
          Object.entries(state).forEach(([key, presences]) => {
            if (presences[0]) map[key] = presences[0];
          });
          setParticipants(map);
        })
        .on('broadcast', { event: 'signal' }, ({ payload }) => handleSignal(payload))
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ userId: userId.current, displayName, identity: identity || 'Mixte', city: city || '' });
            setJoined(true);
          }
        });
    } catch (e) {
      setError('Impossible d\'accéder au microphone : ' + e.message);
    }
  };

  const leaveRoom = () => {
    Object.values(peers.current).forEach(({ pc }) => pc.close());
    peers.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStreamState(null);
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setJoined(false);
    setParticipants({});
  };

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks();
    if (!tracks) return;
    const next = !muted;
    tracks.forEach(t => { t.enabled = !next; });
    setMuted(next);
  };

  useEffect(() => () => leaveRoom(), []);

  const participantList = Object.entries(participants).filter(([id]) => id !== userId.current);

  return (
    <section aria-label="Salon voix" style={{ minHeight: '100vh', background: T.dark, color: T.text, fontFamily: 'Georgia, serif', padding: '24px 16px' }}>
      <h2 style={{ color: T.gold, letterSpacing: 6, fontWeight: 400, margin: '0 0 20px', textAlign: 'center' }}>
        SALON VOIX
      </h2>

      {!joined ? (
        <div style={{ textAlign: 'center' }}>
          {error && <p style={{ color: '#FF6B6B', marginBottom: 16 }}>{error}</p>}
          <button onClick={joinRoom} style={{
            background: T.goldDim, border: `1px solid ${T.gold}`,
            color: T.gold, padding: '14px 32px', cursor: 'pointer',
            fontSize: 12, letterSpacing: 3, fontFamily: 'Georgia, serif', borderRadius: 4,
          }}>
            REJOINDRE LA SALLE VOIX
          </button>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <button onClick={toggleMute} style={{
              background: muted ? 'rgba(255,107,107,0.15)' : T.goldDim,
              border: `1px solid ${muted ? '#FF6B6B' : T.gold}`,
              color: muted ? '#FF6B6B' : T.gold,
              padding: '8px 20px', cursor: 'pointer',
              fontSize: 11, letterSpacing: 2, fontFamily: 'Georgia, serif', borderRadius: 20,
            }}>
              {muted ? '🎤 MUET' : '🎤 EN DIRECT'}
            </button>

            <label className="sr-only" htmlFor="listen-filter">Filtrer l'écoute par identité</label>
            <select id="listen-filter" value={listenFilter} onChange={e => setListenFilter(e.target.value)} style={{
              background: T.dark, border: `1px solid ${T.goldBorder}`,
              color: T.gold, padding: '8px 12px', borderRadius: 20,
              fontSize: 11, letterSpacing: 2, fontFamily: 'Georgia, serif', cursor: 'pointer',
            }}>
              {IDENTITIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            <button onClick={leaveRoom} style={{
              background: 'transparent', border: `1px solid ${T.goldBorder}`,
              color: T.goldBorder, padding: '8px 20px', cursor: 'pointer',
              fontSize: 11, letterSpacing: 2, fontFamily: 'Georgia, serif', borderRadius: 20,
            }}>
              QUITTER
            </button>
          </div>

          {/* Participant avatars */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            {/* Self */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: `2px solid ${localSpeaking && !muted ? T.gold : T.goldBorder}`,
                boxShadow: localSpeaking && !muted ? `0 0 16px ${T.gold}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: T.goldDim, fontSize: 22, transition: 'all 0.15s',
              }}>
                👤
              </div>
              <div style={{ color: T.gold, fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
                {displayName}<br /><span style={{ color: T.goldBorder }}>(moi)</span>
              </div>
            </div>

            {participantList.map(([peerId, info]) => (
              <div key={peerId} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: `2px solid ${T.goldBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(30,30,30,0.9)', fontSize: 22,
                }}>
                  👤
                </div>
                <div style={{ color: T.text, fontSize: 10, marginTop: 6 }}>
                  {info.displayName || peerId}
                  {info.city && <><br /><span style={{ color: T.goldBorder }}>{info.city}</span></>}
                </div>
                {/* Hidden audio element */}
                <audio ref={el => { if (el) audioRefs.current[peerId] = el; }} autoPlay playsInline style={{ display: 'none' }} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
