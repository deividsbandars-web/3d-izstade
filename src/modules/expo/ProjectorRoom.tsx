import { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  Environment, 
  Stars,
  MeshReflectorMaterial,
  useVideoTexture
} from '@react-three/drei';
import { useNavigate } from 'react-router-dom';

function VideoProjector({ url }: { url: string }) {
  const texture = useVideoTexture(url, { crossOrigin: 'Anonymous', loop: true, muted: true });
  return (
    <group position={[0, 15, -49]}>
      {/* Screen */}
      <mesh>
        <planeGeometry args={[80, 45]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Glow from screen */}
      <rectAreaLight width={80} height={45} intensity={5} color="#3b82f6" position={[0, 0, 5]} />
    </group>
  );
}

function Player() {
  const { camera } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  const speed = 10;

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

  useFrame((_, delta) => {
    if (mov.f) camera.translateZ(-speed * delta);
    if (mov.b) camera.translateZ(speed * delta);
    if (mov.l) camera.translateX(-speed * delta);
    if (mov.r) camera.translateX(speed * delta);
    camera.position.setY(1.7);
  });
  return null;
}

export default function ProjectorRoom() {
  const [isL, setIsL] = useState(false);
  const nav = useNavigate();
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <button onClick={() => nav('/expo-3d')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}>
          ← LEAVE ROOM
        </button>
      </div>

      <Canvas shadows camera={{ fov: 60, position: [0, 1.7, 30] }}>
        <Suspense fallback={null}>
          <PointerLockControls ref={controlsRef} onLock={() => setIsL(true)} onUnlock={() => setIsL(false)} />
          <Stars radius={100} depth={50} count={5000} factor={4} />
          <ambientLight intensity={0.1} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[200, 200]} />
            <MeshReflectorMaterial
              blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={40} roughness={1} depthScale={1.2}
              minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#050505" metalness={0.5}
            />
          </mesh>

          {/* Walls */}
          <mesh position={[0, 25, -50]}>
            <boxGeometry args={[100, 50, 1]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>

          <VideoProjector url="https://vjs.zencdn.net/v/oceans.mp4" />
          
          <Player />
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {!isL && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.9)', zIndex: 10 }}>
          <h1 style={{ color: '#fff', fontSize: '3rem', fontWeight: 900, marginBottom: '20px' }}>CINEMATIC PROJECTOR ROOM</h1>
          <button onClick={() => controlsRef.current?.lock()} className="btn-pro" style={{ padding: '20px 60px', background: '#3b82f6' }}>START PROJECTION</button>
        </div>
      )}
    </div>
  );
}
