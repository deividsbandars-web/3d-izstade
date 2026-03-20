import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  OrbitControls,
  Text, 
  Html,
  Sky,
  useVideoTexture,
  Bvh,
  Environment,
  Loader,
  Center
} from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { expoService } from '../../services/expoService';
import { useGLTF } from '@react-three/drei';
import PixelStreamingViewer from './PixelStreamingViewer';

// --- PILSĒTAS 3D MODELIS (PHASE 1 - ROKU DARBS) ---

// 1. Dinamiskais Ielādētājs
function DynamicModel({ url, position, scale = 1, rotation = [0, 0, 0] }: any) {
  try {
    const gltf = useGLTF(url) as any;
    const clonedScene = React.useMemo(() => gltf.scene.clone(), [gltf.scene, url]);
    
    // <Center> ir vienīgais veids, kā garantēt, ka māja stāv uz zemes
    return (
      <Center position={position} bottom>
        <primitive object={clonedScene} scale={scale} rotation={rotation} />
      </Center>
    );
  } catch (e) {
    console.error("Nevar ielādēt modeli:", url);
    return null; 
  }
}

// 2. TAVS PILSĒTAS PLĀNS
const CITY_LAYOUT = [
  // Izmantojam 0 kā Y asi, jo <Center> parūpēsies par pārējo
  { id: 'londonas_maja', url: '/models/free_london_kinnaird_house.glb', position: [0, 0, 0], scale: 1, rotation: [0, 0, 0] },
];

function CityModel() {
  return (
    <Suspense fallback={null}>
      {/* 2 Metrus augsts kubs (cilvēks) tieši centrā atskatei */}
      <mesh position={[2, 1, 0]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {CITY_LAYOUT.map((item) => (
        <DynamicModel 
          key={item.id} 
          url={item.url} 
          position={item.position} 
          scale={item.scale} 
          rotation={item.rotation} 
        />
      ))}
    </Suspense>
  );
}

// --- MULTIPLAYER GUESTS ---
function Guests({ guests }: { guests: any[] }) {
  return (
    <group>
      {guests.map(g => (
        <group key={g.id} position={g.position}>
          {/* Speaking Aura */}
          {g.isSpeaking && (
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.1} />
            </mesh>
          )}
          <mesh position={[0, 1, 0]} castShadow>
            <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
            <meshStandardMaterial color={g.color || '#3b82f6'} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
          <Html position={[0, 2.8, 0]} center>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              {g.isSpeaking && <div style={{ fontSize: '12px' }}>🎙️</div>}
              <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                User_{g.id.substring(0,4)}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// --- VIDEO EKRĀNS ---
function SafeVideo({ url }: { url: string | null }) {
  const defaultVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const texture = useVideoTexture(url || defaultVideo, { crossOrigin: 'anonymous', loop: true, muted: true });
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

// --- PAVILJONS ---
// Custom component to handle model loading safely
function ValidBoothModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} position={[0, 0.2, 0]} />;
}

function DistrictBooth({ position, rotation, company, color }: any) {
  const [hovered, setHovered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const nav = useNavigate();

  const modelUrl = company.booth?.model_url || company['3d_model_url'];

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.1, 0]} receiveShadow><boxGeometry args={[22, 0.2, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
      
      <Suspense fallback={<mesh position={[0, 8, -7.5]} castShadow><boxGeometry args={[22, 16, 1]} /><meshStandardMaterial color="#1e293b" /></mesh>}>
        {modelUrl && modelUrl.endsWith('.glb') ? (
          <ValidBoothModel url={modelUrl} />
        ) : (
          <mesh position={[0, 8, -7.5]} castShadow><boxGeometry args={[22, 16, 1]} /><meshStandardMaterial color="#1e293b" /></mesh>
        )}
      </Suspense>

      <mesh position={[0, 16.5, -7]} castShadow><boxGeometry args={[22, 3, 1.2]} /><meshStandardMaterial color={color} /></mesh>
      <Text position={[0, 16.5, -6.3]} fontSize={1.5} color="#fff" fontWeight="black">{company.name.toUpperCase()}</Text>
      
      <mesh position={[0, 8, -6.9]} onClick={(e) => { e.stopPropagation(); window.open(company.website || '#', '_blank'); }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
        <planeGeometry args={[18, 10]} />
        <Suspense fallback={<meshStandardMaterial color="#000" />}>
          <SafeVideo url={company.booth?.video_url || null} />
        </Suspense>
      </mesh>

      <group position={[0, 1.5, 5]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={(e) => { e.stopPropagation(); setShowForm(true); }}>
        <mesh castShadow receiveShadow><boxGeometry args={[8, 3, 3]} /><meshStandardMaterial color="#f8fafc" /></mesh>
        <mesh position={[0, 1.6, 0]} rotation={[-0.2, 0, 0]} castShadow><boxGeometry args={[8.2, 0.5, 3.2]} /><meshStandardMaterial color={hovered ? color : "#0f172a"} /></mesh>
        <Text position={[0, 2, 0.8]} rotation={[-0.2, 0, 0]} fontSize={0.5} color="#fff" fontWeight="bold">VISIT BOOTH</Text>
        {(hovered || showForm) && (
          <Html position={[0, 5, 0]} center transform distanceFactor={10}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: `5px solid ${color}`, boxShadow: '0 15px 40px rgba(0,0,0,0.2)', width: '300px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>{company.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setIsCalling(true)} style={{ width: '100%', padding: '12px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>📞 LIVE VIDEO CALL</button>
                <button onClick={() => nav(`/expo/booth/${company.id}`)} style={{ width: '100%', padding: '12px', background: color, border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>ENTER 3D SPACE</button>
              </div>
              {isCalling && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '300px', background: '#000', borderRadius: '20px', border: '2px solid #10b981', zIndex: 2000, overflow: 'hidden', boxShadow: '0 0 50px rgba(16, 185, 129, 0.5)' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>LIVE CONNECTION: SECURE</div>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '2rem' }}>👤</span></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={() => setIsCalling(false)} style={{ background: '#ef4444', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>📵</button>
                    <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>🎤</button>
                  </div>
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// --- PLAYER ---
function Player({ mode, onMove }: any) {
  const { camera } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  
  useEffect(() => {
    if (mode !== 'walk') return;
    const d = (e: any) => { switch (e.code) { case 'KeyW': setMov(m => ({ ...m, f: true })); break; case 'KeyS': setMov(m => ({ ...m, b: true })); break; case 'KeyA': setMov(m => ({ ...m, l: true })); break; case 'KeyD': setMov(m => ({ ...m, r: true })); break; } };
    const u = (e: any) => { switch (e.code) { case 'KeyW': setMov(m => ({ ...m, f: false })); break; case 'KeyS': setMov(m => ({ ...m, b: false })); break; case 'KeyA': setMov(m => ({ ...m, l: false })); break; case 'KeyD': setMov(m => ({ ...m, r: false })); break; } };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, [mode]);

  const lastMoveTime = useRef(0);

  useFrame((_, delta) => {
    if (mode === 'walk') {
      const speed = 20;
      let moved = false;
      if (mov.f) { camera.translateZ(-speed * delta); moved = true; }
      if (mov.b) { camera.translateZ(speed * delta); moved = true; }
      if (mov.l) { camera.translateX(-speed * delta); moved = true; }
      if (mov.r) { camera.translateX(speed * delta); moved = true; }
      camera.position.setY(2);

      if (moved && onMove && Date.now() - lastMoveTime.current > 200) {
        lastMoveTime.current = Date.now();
        onMove([camera.position.x, camera.position.y, camera.position.z]);
      }
    }
  });

  return mode === 'fly' ? <OrbitControls enablePan enableZoom enableRotate maxDistance={500} /> : (mode === 'walk' ? <PointerLockControls /> : null);
}

// --- FALLBACK DATA ---
const FALLBACK_SECTORS = [
  { id: "1", name: "Construction", color_theme: "#3b82f6", map_position: { x: 0, y: 0, z: -100 } },
  { id: "2", name: "Technology", color_theme: "#10b981", map_position: { x: 0, y: 0, z: -300 } }
];

const FALLBACK_COMPANIES = [
  { id: "c1", name: "BuildMaster SIA", sector_id: "1", website: "https://warpala.com", booth: {} },
  { id: "c2", name: "TechCorp Global", sector_id: "2", website: "https://warpala.com", booth: {} }
];

// --- MAIN ---
export default function Expo3D() {
  const [mode, setMode] = useState<'menu' | 'walk' | 'fly' | 'unreal'>('menu');
  const [data, setData] = useState<any>({ sectors: [], companies: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState<any[]>([]);
  const [playerPos, setPlayerPos] = useState<number[]>([0, 2, 10]); // Sākam daudz tuvāk (Z=10)
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const channelRef = useRef<any>(null);
  const nav = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [sectors, companies] = await Promise.all([expoService.getSectors(), expoService.getCompaniesWithBooths()]);
        
        if (!sectors || sectors.length === 0) {
          throw new Error("No sectors found");
        }
        
        setData({ sectors, companies });
      } catch (e) { 
        console.error("Using fallback data due to error:", e);
        setData({ sectors: FALLBACK_SECTORS, companies: FALLBACK_COMPANIES });
      } finally { 
        setIsLoading(false); 
      }
    }
    loadData();
  }, []);

  // MULTIPLAYER & VOICE LOGIC
  useEffect(() => {
    if (mode !== 'menu') {
      const myId = Math.random().toString(36).substring(7);
      const myColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5).getStyle();
      
      const channel = supabase.channel('expo_room', {
        config: { presence: { key: myId } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeGuests = [];
        for (const id in newState) {
          if (id !== myId) activeGuests.push(newState[id][0]);
        }
        setGuests(activeGuests);
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: myId, position: [0, 2, 80], color: myColor, isSpeaking: false });
        }
      });

      channelRef.current = { channel, myId, myColor };
      return () => { supabase.removeChannel(channel); };
    }
  }, [mode]);

  // Voice Detection Simulation
  useEffect(() => {
    if (isMicOn) {
      const interval = setInterval(() => {
        // Simulējam balss aktivitāti (reālā dzīvē te būtu AudioContext analizators)
        const speaking = Math.random() > 0.7;
        setIsSpeaking(speaking);
        if (channelRef.current) {
          const { channel, myId, myColor } = channelRef.current;
          channel.track({ id: myId, position: playerPos, color: myColor, isSpeaking: speaking });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isMicOn, playerPos]);

  const handleMyMove = (pos: number[]) => {
    setPlayerPos(pos);
    if (channelRef.current) {
      const { channel, myId, myColor } = channelRef.current;
      channel.track({ id: myId, position: pos, color: myColor, isSpeaking });
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      {mode === 'menu' && (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8) 0%, #020617 100%)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '60px 80px' }}>
            <h1 className="text-accent" style={{ fontSize: '5rem', fontWeight: 950, margin: 0 }}>WARPALA</h1>
            <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '50px' }}>INDUSTRIĀLĀ METAVERSE</h2>
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button onClick={() => setMode('walk')} className="btn-primary">🚶 WALK LITE (WEB3D)</button>
                <button onClick={() => setMode('fly')} className="btn-glass">🦅 DRONE VIEW</button>
              </div>
              <button 
                onClick={() => setMode('unreal')} 
                style={{ padding: '15px 30px', background: 'linear-gradient(90deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
              >
                🎮 ENTER FULL UNREAL ENGINE CITY (PIXEL STREAM)
              </button>
            </div>
            <button onClick={() => nav('/')} style={{ marginTop: '40px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>← BACK TO OS DASHBOARD</button>
          </div>
        </div>
      )}

      {mode === 'unreal' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000 }}>
          <PixelStreamingViewer onClose={() => setMode('menu')} />
        </div>
      )}

      {mode !== 'menu' && mode !== 'unreal' && (
        <>
          <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 100, display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => setIsMicOn(!isMicOn)} 
              style={{ background: isMicOn ? '#10b981' : 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {isMicOn ? '🎙️ MIC ON' : '🔇 MIC OFF'}
            </button>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px 20px', borderRadius: '10px', color: '#10b981', fontWeight: 'bold' }}>
              ONLINE: {guests.length + 1}
            </div>
            <button onClick={() => { document.exitPointerLock(); setMode('menu'); }} style={{ background: 'white', padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>EXIT TO LOBBY</button>
          </div>

          {/* MINIMAP OVERLAY */}
          <div style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 100, width: '200px', height: '200px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '50%', border: '2px solid rgba(59, 130, 246, 0.5)', overflow: 'hidden', backdropFilter: 'blur(5px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' }}>
              <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (playerPos[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (playerPos[0] / 200) * 100, 5), 95)}%`, width: '10px', height: '10px', background: isSpeaking ? '#10b981' : '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: isSpeaking ? '0 0 15px #10b981' : 'none' }}></div>
              {guests.map(g => (
                <div key={g.id} style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (g.position[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (g.position[0] / 200) * 100, 5), 95)}%`, width: '8px', height: '8px', background: g.isSpeaking ? '#10b981' : (g.color || '#3b82f6'), borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: g.isSpeaking ? '0 0 10px #10b981' : 'none' }}></div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px' }}>GPS: {Math.round(playerPos[0])}, {Math.round(playerPos[2])}</div>
          </div>
        </>
      )}

      {mode !== 'unreal' && (
        <Canvas 
          shadows 
          gl={{ antialias: true }} 
          // Atbīdām kameru tālu atpakaļ (Z=50) un uz augšu (Y=10), lai redzētu kopskatu
          camera={{ position: [0, 10, 50], fov: 60 }}
          onCreated={({ gl }) => {
            if (gl.xr && typeof (gl.xr as any).getEnvironmentBlendMode !== 'function') {
              (gl.xr as any).getEnvironmentBlendMode = () => 'opaque';
            }
          }}
        >
          <Suspense fallback={null}>
            <Bvh firstHitOnly>
              <color attach="background" args={['#020617']} />
              <Sky sunPosition={[100, 20, 100]} />
              <Environment preset="city" />
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 10]} intensity={1.2} castShadow />
              <hemisphereLight args={['#ffffff', '#444444', 0.5]} />
              <fog attach="fog" args={['#020617', 10, 800]} />

              {/* VIENKĀRŠA CIETA ZEME (Vairs nekāda atspīduma vai ūdens) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[2000, 2000]} />
                <meshStandardMaterial color="#2d3748" roughness={1} />
              </mesh>

              <CityModel />
              
              <Guests guests={guests} />

              {/* VECOS STENDUS PILNĪBĀ PASLĒPJAM (scale={0}), LAI TIE NEKĀDĀ VEIDĀ NEJAUKTOS AR JAUNO PILSĒTU */}
              <group scale={0}>
                {data.sectors.map((s: any) => (
                  <group key={s.id} position={[0, 0, s.map_position?.z || -100]}>
                    <group position={[0, 28, 0]}><mesh castShadow><boxGeometry args={[35, 6, 2]} /><meshStandardMaterial color={s.color_theme} /></mesh><Text position={[0, 0, 1.1]} fontSize={2.5} color="#fff" fontWeight="black">{s.name.toUpperCase()}</Text></group>
                    {data.companies.filter((c: any) => c.sector_id === s.id).map((c: any, index: number) => {
                      const side = index % 2 === 0 ? -1 : 1;
                      return <DistrictBooth key={c.id} position={[side * 35, 0, Math.floor(index / 2) * -40]} rotation={[0, side === -1 ? Math.PI/2 : -Math.PI/2, 0]} company={c} color={s.color_theme} />;
                    })}
                  </group>
                ))}
              </group>

              <Player mode={mode} onMove={handleMyMove} />
            </Bvh>
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
