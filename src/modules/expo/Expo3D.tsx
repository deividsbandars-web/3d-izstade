import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  OrbitControls,
  Text, 
  Html,
  Sky,
  Environment,
  Bvh,
  Loader,
  useVideoTexture
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { expoService } from '../../services/expoService';
import { useGLTF } from '@react-three/drei';
import PixelStreamingViewer from './PixelStreamingViewer';
import { normalizeModel, quantizeVectorArray } from '../../utils/threeUtils';
import { useZoneSystem } from '../../hooks/useZoneSystem';
import { StreamingTrigger } from '../../components/StreamingTrigger';
import { PixelStreamOverlay } from '../../components/PixelStreamOverlay';
import { CityGenerator } from '../city/CityGenerator';
import { BoothUI } from '../../components/BoothUI';

import { processAssets } from '../../utils/proAssetPipeline';

// WORLD SYSTEM CONSTANTS
const SYNC_THROTTLE = 50; // ms

import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// ... (other imports)

// 1. PRO ASSET POOL
const ASSET_URLS = [
  '/models/free_london_kinnaird_house.glb',
  '/models/free__atlanta_corperate_office_building.glb',
  '/models/european_buildings_asset_pack_3.glb',
  '/models/american_road.glb',
  '/models/american_road_intersection.glb',
  '/models/victorian_street_lamp.glb',
  '/models/trees_in_the_park_anthropos.glb'
  // '/models/default_booth.glb' // ❌ BOJĀTS FAILS (Unexpected end of JSON input)
];

// --- FALLBACK DATA ---
const FALLBACK_SECTORS = [
  { id: "1", name: "Construction", color_theme: "#3b82f6", map_position: { x: 0, y: 0, z: -100 } },
  { id: "2", name: "Technology", color_theme: "#10b981", map_position: { x: 0, y: 0, z: -300 } }
];

const FALLBACK_COMPANIES = [
  { id: "c1", name: "BuildMaster SIA", sector_id: "1", website: "https://warpala.com", booth: {} },
  { id: "c2", name: "TechCorp Global", sector_id: "2", website: "https://warpala.com", booth: {} }
];

function CityModel({ debug = false, zoneSystem }: { debug?: boolean, zoneSystem?: any }) {
  const { scene } = useThree();
  const [cityGenerated, setCityGenerated] = useState(false);
  
  React.useEffect(() => {
    (window as any).scene = scene;
  }, [scene]);

  const gltfs = useGLTF(ASSET_URLS) as any[];

  useEffect(() => {
    if (!scene || cityGenerated || !gltfs || gltfs.length === 0) return;

    // 1. Klonējam source modeļus (SAFE CLONE ar SkeletonUtils)
    const rawModels = gltfs.map((gltf, i) => {
      // 🚀 SAFE CLONE FIX: Novērš materiālu un skeletu kļūdas
      const clone = SkeletonUtils.clone(gltf.scene);
      clone.name = ASSET_URLS[i].split('/').pop() || `model_${i}`;
      return clone;
    });

    const processed = processAssets(rawModels, ASSET_URLS);

    // 🚀 AUTO ZONE BINDING: Padodam zoneSystem ģeneratoram
    const generator = new CityGenerator(scene, processed, zoneSystem);
    generator.generate({
      gridSize: 15, // INSTANCING ENABLED: Varam droši atgriezties pie lielas pilsētas!
      spacing: 12 
    });
    
    setCityGenerated(true);
    console.log("🏙️ AAA City Generated Successfully!");
  }, [scene, cityGenerated, gltfs, zoneSystem]);

  return (
    <Suspense fallback={null}>
      {debug && (
        <>
          <gridHelper args={[500, 50, '#ff0000', '#444444']} position={[0, 0.05, 0]} />
          <axesHelper args={[100]} position={[0, 0.1, 0]} />
        </>
      )}

      {/* ZAĻŠ kubs (cilvēks) tieši centrā atskatei */}
      <mesh position={[5, 1, -20]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="lime" />
      </mesh>
    </Suspense>
  );
}

// --- MULTIPLAYER GUESTS ---
function Guests({ guests }: { guests: any[] }) {
  return (
    <group>
      {guests.map(g => (
        <group key={g.id} position={g.position}>
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
function ValidBoothModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const normalizedScene = React.useMemo(() => {
    const clone = scene.clone();
    normalizeModel(clone); // Iestata lokālo nobīdi pamatnei
    return clone;
  }, [scene]);

  // ✅ RIGHT: Izmantojam wrapper grupu pasaulei
  return (
    <group position={[0, 0.2, 0]}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function DistrictBooth({ position, rotation, company, color }: any) {
  const [hovered, setHovered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const nav = useNavigate();
  const modelUrl = company?.booth?.model_url || company?.['3d_model_url'];

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
      <Text position={[0, 16.5, -6.3]} fontSize={1.5} color="#fff" fontWeight="black">{company?.name?.toUpperCase() || "BOOTH"}</Text>
      <mesh position={[0, 8, -6.9]} onClick={(e) => { e.stopPropagation(); window.open(company?.website || '#', '_blank'); }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
        <planeGeometry args={[18, 10]} />
        <Suspense fallback={<meshStandardMaterial color="#000" />}>
          <SafeVideo url={company?.booth?.video_url || null} />
        </Suspense>
      </mesh>
      <group position={[0, 1.5, 5]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={(e) => { e.stopPropagation(); setShowForm(true); }}>
        <mesh castShadow receiveShadow><boxGeometry args={[8, 3, 3]} /><meshStandardMaterial color="#f8fafc" /></mesh>
        <mesh position={[0, 1.6, 0]} rotation={[-0.2, 0, 0]} castShadow><boxGeometry args={[8.2, 0.5, 3.2]} /><meshStandardMaterial color={hovered ? color : "#0f172a"} /></mesh>
        <Text position={[0, 2, 0.8]} rotation={[-0.2, 0, 0]} fontSize={0.5} color="#fff" fontWeight="bold">VISIT BOOTH</Text>
        {(hovered || showForm) && (
          <Html position={[0, 5, 0]} center transform distanceFactor={10}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: `5px solid ${color}`, boxShadow: '0 15px 40px rgba(0,0,0,0.2)', width: '300px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>{company?.name || "Company"}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button style={{ width: '100%', padding: '12px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>📞 LIVE VIDEO CALL</button>
                <button onClick={() => nav(`/expo/booth/${company?.id}`)} style={{ width: '100%', padding: '12px', background: color, border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>ENTER 3D SPACE</button>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// --- PLAYER ---
function Player({ mode, onMove }: any) {
  const { camera, scene } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  const raycaster = useRef(new THREE.Raycaster());
  const moveVector = useRef(new THREE.Vector3());
  
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
      const speed = 12 * delta; 
      moveVector.current.set(0, 0, 0);
      
      if (mov.f) moveVector.current.z -= speed;
      if (mov.b) moveVector.current.z += speed;
      if (mov.l) moveVector.current.x -= speed;
      if (mov.r) moveVector.current.x += speed;

      const moved = moveVector.current.lengthSq() > 0;

      if (moved) {
        // 🚀 COLLISION PRE-CHECK
        // Saglabājam kameras oriģinālo virzienu
        moveVector.current.applyQuaternion(camera.quaternion);
        moveVector.current.y = 0; // Novēršam lidošanu uz augšu/leju
        
        const dir = moveVector.current.clone().normalize();
        
        // 🚀 RAYCAST LOGIC
        // Šaujam staru no kameras pozīcijas kustības virzienā
        (raycaster.current as any).firstHitOnly = true; // BVH optimization
        raycaster.current.set(camera.position, dir);
        
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        
        // 🚀 VALIDATION: Ja priekšā ir siena tuvāk par 1.5m, bloķējam!
        if (intersects.length > 0 && intersects[0].distance < 1.5) {
          // Kustība bloķēta
        } else {
          // 🚀 APPLY MOVEMENT
          camera.position.add(moveVector.current);
        }
      }

      // 🚀 Y-AXIS OVERRIDE (Moved AFTER collision, removed dead code)
      camera.position.setY(5);

      if (moved && onMove && Date.now() - lastMoveTime.current > 200) {
        lastMoveTime.current = Date.now();
        onMove([camera.position.x, camera.position.y, camera.position.z]);
      }
    }
  });

  return mode === 'fly' ? <OrbitControls enablePan enableZoom enableRotate maxDistance={500} enableDamping dampingFactor={0.05} /> : (mode === 'walk' ? <PointerLockControls /> : null);
}

// --- MAIN ---
export default function Expo3D() {
  const [mode, setMode] = useState<'menu' | 'walk' | 'fly' | 'unreal'>('menu');
  const [debug, setDebug] = useState(false);
  const [data, setData] = useState<any>({ sectors: [], companies: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState<any[]>([]);
  const [playerPos, setPlayerPos] = useState<number[]>([0, 5, 10]);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking] = useState(false);
  const channelRef = useRef<any>(null);
  const nav = useNavigate();

  // Audio and Interaction Hooks
  // useAmbientSound(); // 🔇 Izslēdzam lēto mūziku, kamēr neatradīsim premium pilsētas ambient skaņu
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);

  useEffect(() => {
    zoneSystem.addZone({
      id: "booth_1",
      type: "pixelstream",
      position: [10, 0, -5],
      radius: 5,
      streamId: "stream_001",
    });

    zoneSystem.addZone({
      id: "booth_2",
      type: "pixelstream",
      position: [-15, 0, 8],
      radius: 5,
      streamId: "stream_002",
    });
  }, [zoneSystem]);

  const handleEnterStream = (id: string) => setStreamId(id);
  const handleCloseStream = () => setStreamId(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sectors, companies] = await Promise.all([expoService.getSectors(), expoService.getCompaniesWithBooths()]);
        if (!sectors || sectors.length === 0) throw new Error("No sectors found");
        setData({ sectors, companies });
      } catch (e) { 
        console.error("Using fallback data due to error:", e);
        setData({ sectors: FALLBACK_SECTORS, companies: FALLBACK_COMPANIES });
      } finally { setIsLoading(false); }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (mode !== 'menu') {
      const myId = Math.random().toString(36).substring(7);
      const myColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5).getStyle();
      const channel = supabase.channel('expo_room', { config: { presence: { key: myId } } });
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeGuests = [];
        for (const id in newState) { if (id !== myId) activeGuests.push(newState[id][0]); }
        setGuests(activeGuests);
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') { await channel.track({ id: myId, position: [0, 2, 10], color: myColor, isSpeaking: false }); }
      });
      channelRef.current = { channel, myId, myColor };
      return () => { supabase.removeChannel(channel); };
    }
  }, [mode]);

  const lastSyncTime = useRef(0);

  const handleMyMove = (pos: number[]) => {
    setPlayerPos(pos);
    
    const now = Date.now();
    if (now - lastSyncTime.current > SYNC_THROTTLE) {
      if (channelRef.current) {
        const { channel, myId, myColor } = channelRef.current;
        const safePos = quantizeVectorArray(pos);
        channel.track({ id: myId, position: safePos, color: myColor, isSpeaking });
      }
      lastSyncTime.current = now;
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
              <button onClick={() => setMode('unreal')} style={{ padding: '15px 30px', background: 'linear-gradient(90deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
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
            <button 
              onClick={() => setDebug(!debug)} 
              style={{ background: debug ? '#ef4444' : 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              DEBUG: {debug ? 'ON' : 'OFF'}
            </button>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px 20px', borderRadius: '10px', color: '#10b981', fontWeight: 'bold' }}>
              ONLINE: {guests.length + 1}
            </div>
            <button onClick={() => { document.exitPointerLock(); setMode('menu'); }} style={{ background: 'white', padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>EXIT TO LOBBY</button>
          </div>

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

          <StreamingTrigger zone={activeZone} onEnter={handleEnterStream} />
          <PixelStreamOverlay streamId={streamId} onClose={handleCloseStream} />
          <BoothUI visible={!!activeZone} zoneName={activeZone?.id} />
        </>
      )}

      {mode !== 'menu' && mode !== 'unreal' && (
        <Canvas shadows gl={{ antialias: true }} camera={{ position: [0, 2, 10], fov: 60 }}>
          <Suspense fallback={null}>
            <Bvh firstHitOnly>
              <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.49} azimuth={0.25} />
              <Environment preset="city" />
              
              <ambientLight intensity={0.3} />
              <directionalLight 
                position={[20, 30, 10]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]} 
              />
              <hemisphereLight args={["#87CEEB", "#222222", 0.5]} />
              <fog attach="fog" args={["#0a0a0a", 80, 300]} />

              <EffectComposer>
                <Bloom intensity={0.5} luminanceThreshold={0.3} luminanceSmoothing={0.9} />
              </EffectComposer>

              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[2000, 2000]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.1} />
              </mesh>

              <CityModel debug={debug} />
              <Guests guests={guests} />
              <group scale={0}>
                {data.sectors.map((s: any) => (
                  <group key={s.id} position={[0, 0, s.map_position?.z || -100]}>
                    <DistrictBooth company={{}} color={s.color_theme} />
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
