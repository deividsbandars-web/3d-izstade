import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  Text, 
  Environment, 
  Html,
  Stars,
  Float,
  MeshReflectorMaterial
} from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

// Global sales state simulation
let totalRevenue = 0;
let itemsSoldStandard = 0;
let itemsSoldCollector = 0;

// Pre-generate random points outside of render to satisfy purity rules
const COSMIC_COUNT = 50000;
const COSMIC_POINTS = new Float32Array(COSMIC_COUNT * 3);
for (let i = 0; i < COSMIC_COUNT; i++) {
  const r = 40 + Math.random() * 20;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  COSMIC_POINTS[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  COSMIC_POINTS[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  COSMIC_POINTS[i * 3 + 2] = r * Math.cos(phi);
}

function StaticTextLabel({ text, position, rotation = [0, 0, 0], color, size = 1, opacity = 1 }: any) {
  return (
    <Text 
      position={position} 
      rotation={rotation} 
      fontSize={size} 
      color={color} 
      anchorX="center" 
      anchorY="middle" 
      font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf" 
      fontWeight={900} 
      fillOpacity={opacity}
    >
      {text}
    </Text>
  );
}

function ArtPiece({ position, rotation, title, artist, price, imageUrl, color, isCollector }: any) {
  const [purchased, setPurchased] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<string[]>(['Satriecošas krāsas!', '8K izskatās izcili uz mana LED ekrāna.']);
  const [newComment, setNewComment] = useState('');
  
  const buy = (e: any) => {
    e.stopPropagation();
    if (!purchased) {
      setPurchased(true);
      if (isCollector) {
        itemsSoldCollector++;
        totalRevenue += 200;
      } else {
        itemsSoldStandard++;
        totalRevenue += 150;
      }
    }
  };

  const addComment = (e: any) => {
    e.stopPropagation();
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment('');
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0, -0.5]}>
        <boxGeometry args={[10, 14, 0.8]} />
        <meshPhysicalMaterial color="#050505" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[9, 13]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      
      <Html position={[0, 0, 0.1]} center transform distanceFactor={8}>
        <div style={{ 
          width: '360px', height: '520px', overflow: 'hidden', position: 'relative',
          border: purchased ? '12px solid #10b981' : `2px solid ${color}`,
          boxShadow: `0 0 30px ${purchased ? '#10b981' : color}`
        }}>
          <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={title} />
          {purchased && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 900, color: '#fff', transform: 'rotate(-15deg)' }}>
              SOLD
            </div>
          )}
        </div>
      </Html>

      <group position={[0, -9, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.8} color="#fff" fontWeight={900}>{title}</Text>
        <Text position={[0, 0.7, 0]} fontSize={0.4} color="#aaa">by Artist: {artist}</Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color={color} fontWeight={700}>{price} €</Text>
        
        <group position={[0, -1.5, 0]}>
          {!purchased && (
            <group onClick={buy} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
              <mesh><planeGeometry args={[4, 1]} /><meshBasicMaterial color={color} /></mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.3} color="#000" fontWeight={900}>BUY ART</Text>
            </group>
          )}
          <group position={[3, 0, 0]} onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }}>
            <mesh><circleGeometry args={[0.5, 32]} /><meshBasicMaterial color="#334155" /></mesh>
            <Text position={[0, 0, 0.1]} fontSize={0.3} color="#fff">💬</Text>
          </group>
        </group>
      </group>

      {showComments && (
        <Html position={[6, 0, 0]} center transform distanceFactor={10}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: `1px solid ${color}`, padding: '15px', borderRadius: '8px', width: '250px', color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>KOMENTĀRI</div>
            <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '10px', fontSize: '0.65rem' }}>
              {comments.map((c, idx) => <div key={idx} style={{ marginBottom: '5px', padding: '5px', background: 'rgba(255,255,255,0.05)' }}>{c}</div>)}
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Rakstīt..." style={{ flex: 1, background: '#000', border: '1px solid #334155', color: '#fff', fontSize: '0.6rem', padding: '5px' }} />
              <button onClick={addComment} style={{ background: color, border: 'none', color: '#000', fontSize: '0.6rem', padding: '5px' }}>Sūtīt</button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function GalleryHUD() {
  const [rev, setRev] = useState(0);
  const [std, setStd] = useState(0);
  const [col, setCol] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    const i = setInterval(() => {
      setRev(totalRevenue);
      setStd(itemsSoldStandard);
      setCol(itemsSoldCollector);
    }, 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="glass-card" style={{ padding: '20px', background: 'rgba(0,0,0,0.8)', borderColor: '#8b5cf6', pointerEvents: 'auto', width: '320px' }}>
          <div style={{ color: '#8b5cf6', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '2px' }}>INFINITY DIGITAL GALLERY</div>
          
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6', borderRadius: '8px' }}>
            <div style={{ color: '#8b5cf6', fontSize: '0.65rem', fontWeight: 900 }}>CUSTOM BUSINESS PROJECTS</div>
            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>2 000 – 10 000 €</div>
            <div style={{ color: '#aaa', fontSize: '0.6rem', marginTop: '4px' }}>Bespoke 16K Installations</div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#aaa', fontSize: '0.7rem' }}>TOTAL_REVENUE:</div>
            <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 950 }}>{rev} € <span style={{ fontSize: '0.8rem', color: '#444' }}>/ 25 000 €</span></div>
          </div>

          <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
              <div style={{ color: '#8b5cf6', fontSize: '0.6rem' }}>STANDARD</div>
              <div style={{ color: '#fff', fontWeight: 800 }}>{std} / 100</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
              <div style={{ color: '#f59e0b', fontSize: '0.6rem' }}>COLLECTOR</div>
              <div style={{ color: '#fff', fontWeight: 800 }}>{col} / 50</div>
            </div>
          </div>

          <button onClick={() => nav('/expo-3d')} style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'transparent', border: '1px solid #334155', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>← LEAVE GALLERY</button>
        </div>
      </div>
    </div>
  );
}

function CosmicNeonFlow() {
  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (pointsRef.current) {
      const t = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.z = Math.sin(t * 0.1) * 0.2;
      pointsRef.current.scale.setScalar(1 + Math.sin(t * 0.2) * 0.1);
    }
  });

  return (
    <group position={[0, 40, -1000]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute args={[COSMIC_POINTS, 3]} attach="attributes-position" count={COSMIC_COUNT} array={COSMIC_POINTS} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial 
          size={0.4} 
          color="#8b5cf6" 
          transparent 
          opacity={0.8} 
          sizeAttenuation={true} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
        />
      </points>
      <pointLight intensity={100} color="#8b5cf6" distance={200} />
      <StaticTextLabel text="COSMIC NEON FLOW" position={[0, 60, 0]} color="#fff" size={6} />
      <StaticTextLabel text="16K PARTICLES | FLOWING MOTION" position={[0, 50, 0]} color="#8b5cf6" size={2} />
    </group>
  );
}

function MuseumArchitecture() {
  const walls = useMemo(() => [[-150, 0], [150, 0]].map((pos, i) => (
    <mesh key={i} position={[pos[0], 50, -500]}>
      <boxGeometry args={[2, 200, 2000]} />
      <meshPhysicalMaterial 
        color="#0ea5e9" 
        emissive="#0ea5e9" 
        emissiveIntensity={0.2} 
        transmission={0.9} 
        thickness={10} 
        roughness={0.1}
        transparent
        opacity={0.3}
      />
    </mesh>
  )), []);

  const rings = useMemo(() => Array.from({ length: 10 }).map((_, i) => (
    <mesh key={i} position={[0, 80, i * -150]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[140, 0.5, 16, 100]} />
      <meshPhysicalMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={5} toneMapped={false} />
    </mesh>
  )), []);

  return (
    <group>
      {walls}
      {rings}
      <mesh position={[0, 150, -500]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 2000, 32, 32]} />
        <meshStandardMaterial color="#334155" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function CinematicLightShaft({ position, color }: any) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.1, 15, 200, 32, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FloatingGlowSculpture({ position, color }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();
      mesh.current.rotation.x = Math.sin(t * 0.3) * 0.2;
      mesh.current.rotation.y += 0.005;
      mesh.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={mesh} position={position}>
        <torusKnotGeometry args={[10, 0.2, 256, 32]} />
        <meshPhysicalMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={25} 
          metalness={1} 
          roughness={0} 
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={50} color={color} distance={150} />
    </Float>
  );
}

function Player() {
  const { camera } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  const speed = 15;

  useEffect(() => {
    const d = (e: KeyboardEvent) => { 
      switch (e.code) { case 'KeyW': setMov(m => ({ ...m, f: true })); break; case 'KeyS': setMov(m => ({ ...m, b: true })); break; case 'KeyA': setMov(m => ({ ...m, l: true })); break; case 'KeyD': setMov(m => ({ ...m, r: true })); break; } 
    };
    const u = (e: KeyboardEvent) => { 
      switch (e.code) { case 'KeyW': setMov(m => ({ ...m, f: false })); break; case 'KeyS': setMov(m => ({ ...m, b: false })); break; case 'KeyA': setMov(m => ({ ...m, l: false })); break; case 'KeyD': setMov(m => ({ ...m, r: false })); break; } 
    };
    document.addEventListener('keydown', d); document.addEventListener('keyup', u);
    return () => { document.removeEventListener('keydown', d); document.removeEventListener('keyup', u); };
  }, []);

  useFrame((state, delta) => {
    if (!mov.f && !mov.b && !mov.l && !mov.r) {
      const wobble = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.005;
      camera.position.setY(camera.position.y + wobble);
      camera.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z + Math.cos(state.clock.getElapsedTime() * 0.2) * 0.0001);
    } else {
      if (mov.f) camera.translateZ(-speed * delta);
      if (mov.b) camera.translateZ(speed * delta);
      if (mov.l) camera.translateX(-speed * delta);
      if (mov.r) camera.translateX(speed * delta);
    }
    const targetY = 1.7;
    camera.position.setY(THREE.MathUtils.lerp(camera.position.y, targetY, 0.1)); 
  });
  return null;
}

function LiquidChromeWaves() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();
      mesh.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      mesh.current.scale.y = 1 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, -4, -400]}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 1000, 64, 64]} />
        <meshPhysicalMaterial 
          color="#fff" 
          metalness={1} 
          roughness={0.02} 
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={3} />
    </group>
  );
}

function AbstractSculpture({ position, color }: any) {
  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <mesh position={position}>
        <octahedronGeometry args={[5, 0]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={15} metalness={1} roughness={0} />
      </mesh>
      <pointLight position={position} intensity={20} color={color} distance={50} />
    </Float>
  );
}

function SpaceInstallation() {
  const mesh = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.002;
      mesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 5;
    }
  });

  return (
    <group ref={mesh}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[60, 20, -200]}>
          <icosahedronGeometry args={[15, 1]} />
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={5} transmission={0.9} thickness={5} roughness={0} />
        </mesh>
      </Float>
      <group position={[0, 40, -500]}>
        <Stars radius={50} depth={50} count={5000} factor={10} saturation={0} fade speed={2} />
        <mesh>
          <torusKnotGeometry args={[30, 1, 300, 32]} />
          <meshPhysicalMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={20} toneMapped={false} />
        </mesh>
        <pointLight intensity={100} color="#8b5cf6" distance={300} />
      </group>
      <mesh position={[0, 80, -350]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 400, 64, 64]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2} transparent opacity={0.2} wireframe />
      </mesh>
    </group>
  );
}

export default function DigitalGallery() {
  const [isL, setIsL] = useState(false);
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020617' }}>
      <GalleryHUD />
      
      <Canvas shadows camera={{ fov: 45, position: [0, 1.7, 60] }}>
        <Suspense fallback={null}>
          <PointerLockControls ref={controlsRef} onLock={() => setIsL(true)} onUnlock={() => setIsL(false)} />
          <Stars radius={300} depth={100} count={10000} factor={4} />
          <ambientLight intensity={0.1} />
          <pointLight position={[0, 100, 0]} intensity={0.5} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
            <planeGeometry args={[2000, 2000]} />
            <MeshReflectorMaterial
              blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={40} roughness={1} depthScale={1.2}
              minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#050505" metalness={0.5}
            />
          </mesh>

          <group position={[0, 10, 20]}>
            <mesh position={[0, 0, -1]}>
              <boxGeometry args={[40, 15, 1]} />
              <meshPhysicalMaterial color="#050505" metalness={1} roughness={0.1} emissive="#8b5cf6" emissiveIntensity={0.2} />
            </mesh>
            <Text position={[0, 3, 0]} fontSize={2.5} color="#8b5cf6" fontWeight={900}>BUSINESS COMMISSIONS</Text>
            <Text position={[0, -1, 0]} fontSize={4} color="#fff" fontWeight={950}>2 000 – 10 000 €</Text>
            <Text position={[0, -4.5, 0]} fontSize={1} color="#aaa">8K/16K Bespoke Digital Installations</Text>
            <pointLight position={[0, 0, 5]} intensity={2} color="#8b5cf6" />
          </group>

          <group position={[0, 0, -100]}>
            <Text position={[0, 30, -50]} fontSize={8} color="#8b5cf6" fontWeight={950}>8K SPACE VISUALS</Text>
            <ArtPiece position={[-40, 5, 0]} title="ORION NEBULA" artist="Stellar X" price={150} color="#8b5cf6" imageUrl="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80" />
            <ArtPiece position={[40, 5, 0]} title="VOID ARCHITECT" artist="Void Arch" price={150} color="#8b5cf6" imageUrl="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80" />
          </group>

          <group position={[0, 0, -400]}>
            <Text position={[0, 30, -50]} fontSize={8} color="#10b981" fontWeight={950}>8K RELAXING ART</Text>
            <ArtPiece position={[-40, 5, 0]} title="ZEN WATERFALL" artist="Nature AI" price={150} color="#10b981" imageUrl="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" />
            <ArtPiece position={[40, 5, 0]} title="MISTY FOREST" artist="Lumina" price={150} color="#10b981" imageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80" />
          </group>

          <group position={[0, 0, -700]}>
            <Text position={[0, 30, -50]} fontSize={8} color="#ec4899" fontWeight={950}>8K ABSTRACT VISUALS</Text>
            <ArtPiece position={[-40, 5, 0]} title="LIQUID NEON" artist="Vibe Master" price={150} color="#ec4899" imageUrl="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80" />
            <ArtPiece position={[40, 5, 0]} title="FRACTAL FLOW" artist="Geometry X" price={150} color="#ec4899" imageUrl="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80" />
          </group>

          <group position={[0, 0, -800]}>
            <Text position={[0, 35, -50]} fontSize={12} color="#f59e0b" fontWeight={950}>THE COLLECTOR VAULT</Text>
            <Text position={[0, 25, -50]} fontSize={3} color="#fff" fillOpacity={0.8}>Limited 16K Masterpieces | 200 € per piece</Text>
            <ArtPiece position={[-20, 8, 0]} title="ETHEREAL GOLD" artist="Master Zen" price={200} color="#f59e0b" isCollector={true} imageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" />
            <ArtPiece position={[20, 8, 0]} title="COSMIC GENESIS" artist="Stellar X" price={200} color="#f59e0b" isCollector={true} imageUrl="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80" />
            <pointLight position={[0, 20, 0]} intensity={2} color="#f59e0b" />
          </group>

          <Player />
          <MuseumArchitecture />
          <SpaceInstallation />
          <LiquidChromeWaves />
          <CosmicNeonFlow />
          
          <CinematicLightShaft position={[0, 100, -350]} color="#8b5cf6" />
          <CinematicLightShaft position={[60, 100, -200]} color="#0ea5e9" />
          <CinematicLightShaft position={[-60, 100, -200]} color="#ec4899" />
          <FloatingGlowSculpture position={[0, 50, -450]} color="#8b5cf6" />
          <AbstractSculpture position={[-60, 15, -300]} color="#ec4899" />
          <AbstractSculpture position={[60, 25, -550]} color="#0ea5e9" />
          <AbstractSculpture position={[-50, 20, -850]} color="#f59e0b" />

          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {!isL && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
          <h1 style={{ color: '#fff', fontSize: '4rem', fontWeight: 950, marginBottom: '20px' }}>DIGITAL INFINITY</h1>
          <button onClick={() => controlsRef.current?.lock()} className="btn-pro" style={{ padding: '20px 80px', background: '#8b5cf6', fontSize: '1.5rem' }}>START EXHIBITION</button>
          <p style={{ color: '#fff', marginTop: '20px', opacity: 0.5 }}>Use WASD to move, Mouse to look</p>
        </div>
      )}
    </div>
  );
}
