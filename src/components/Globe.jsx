import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const T = { gold: '#D4AF37' };

const CITIES = [
  { name: 'Montréal',  lat: 45.5017,  lon: -73.5673 },
  { name: 'Québec',    lat: 46.8139,  lon: -71.2080 },
  { name: 'Toronto',   lat: 43.6532,  lon: -79.3832 },
  { name: 'Vancouver', lat: 49.2827,  lon: -123.1207 },
  { name: 'Ottawa',    lat: 45.4215,  lon: -75.6972 },
];

function latLonToVec3(lat, lon, r = 1.02) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function RotatingGlobe() {
  const globeRef = useRef();
  const markersRef = useRef();

  useFrame((_, delta) => {
    if (globeRef.current)   globeRef.current.rotation.y   += delta * 0.12;
    if (markersRef.current) markersRef.current.rotation.y += delta * 0.12;
  });

  return (
    <>
      {/* Globe sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#0d0d1a"
          wireframe={false}
          emissive="#1a1a3a"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.001, 32, 32]} />
        <meshBasicMaterial color={T.gold} wireframe opacity={0.07} transparent />
      </mesh>

      {/* City markers */}
      <group ref={markersRef}>
        {CITIES.map(city => {
          const pos = latLonToVec3(city.lat, city.lon);
          return (
            <mesh key={city.name} position={pos}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color={T.gold} emissive={T.gold} emissiveIntensity={1.5} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

export default function Globe() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color={T.gold} />
        <Stars radius={100} depth={50} count={4000} factor={4} fade speed={0.5} />
        <RotatingGlobe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
