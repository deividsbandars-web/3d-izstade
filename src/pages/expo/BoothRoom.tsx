import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Text, Html, Sky, Stars, Environment, Float, MeshReflectorMaterial, Bvh } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { useParams, Link } from 'react-router-dom';
import { supabase, supabaseUrl } from '../../core/supabase';
import * as THREE from 'three';

// --- Shared Components for Theme ---
function SkyWindow() {
  return (
    <group position={[0, 5, -8]}>
      <mesh>
        <planeGeometry args={[20, 10]} />
        <meshPhysicalMaterial color="#fff" transparent opacity={0.1} transmission={0.9} roughness={0} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[20.5, 10.5]} />
        <meshBasicMaterial color="#111" wireframe />
      </mesh>
    </group>
  );
}

function ConstructionInteriors() {
  return (
    <group>
      <mesh position={[-4, 0.5, -2]} castShadow>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshPhysicalMaterial color="#334155" metalness={0.2} roughness={0.2} />
      </mesh>
      <mesh position={[-4, 1.2, -2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1]} />
        <meshPhysicalMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.5} />
      </mesh>
      {[[-6, -4], [6, -4]].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[0.2, 6, 0.2]} /><meshPhysicalMaterial color="#475569" metalness={0.2} /></mesh>
          <mesh position={[0, 5, 2]} rotation={[Math.PI/2, 0, 0]} castShadow><boxGeometry args={[0.2, 4, 0.2]} /><meshPhysicalMaterial color="#475569" metalness={0.2} /></mesh>
        </group>
      ))}
    </group>
  );
}

function TechInteriors({ color }: { color: string }) {
  return (
    <group>
      {[[-3, 3, -2], [3, 4, -3], [0, 5, -4]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.3]} />
            <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
          </mesh>
          <pointLight color={color} intensity={1} distance={5} />
        </group>
      ))}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

function SOSInteriors({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[-5, 1, -2]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshPhysicalMaterial color="#ef4444" metalness={0.5} roughness={0.1} />
      </mesh>
      <group position={[0, 5.5, -4.5]}>
        <mesh>
          <cylinderGeometry args={[2, 2, 0.5]} />
          <meshPhysicalMaterial color="#111" />
        </mesh>
        <pointLight color={color} intensity={5} distance={15} />
      </group>
    </group>
  );
}

function DesignInteriors() {
  return (
    <group>
      <mesh position={[4, 1.5, -2]} castShadow>
        <torusGeometry args={[0.8, 0.05, 16, 100]} />
        <meshPhysicalMaterial color="#fff" metalness={0.2} roughness={0} clearcoat={1} />
      </mesh>
      <spotLight position={[4, 5, -2]} angle={0.3} penumbra={1} intensity={5} color="#fff" castShadow />
      <mesh position={[0, 5, -4.8]}>
        <planeGeometry args={[12, 4]} />
        <meshPhysicalMaterial color="#fff" transparent opacity={0.1} transmission={0.8} thickness={0.5} />
      </mesh>
    </group>
  );
}

interface Booth {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  category: string;
  slug?: string;
}

interface Offer {
  id: string;
  booth_id: string;
  title: string;
  price: string;
  description: string;
}

interface Asset {
  id: string;
  booth_id: string;
  asset_type: 'logo' | 'portfolio' | 'video';
  url: string;
}

export default function BoothRoom() {
  const { id } = useParams<{ id: string }>();
  const [booth, setBooth] = useState<Booth | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAutopilot, setShowAutopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booth && !showAutopilot) {
      const timer = setTimeout(() => {
        setShowAutopilot(true);
        setChatMessages([
          { role: 'ai', text: `⚡ PRO AUTOPILOTS AKTIVIZĒTS: Sveiki! Esmu ${booth.title} mākslīgais intelekts. Izanalizējot mūsu meistaru pieredzi un jūsu interesi, esmu gatavs palīdzēt. Kā varu palīdzēt atrast labāko risinājumu jūsu projektam?` }
        ]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [booth, showAutopilot]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Lielisks jautājums! Mūsu meistari izanalizēs šo. Vai vēlaties, lai sagatavoju ātru tāmi vai uzreiz atveru pieteikuma formu, lai varam sākt sadarbību?` }]);
    }, 1200);
  };

  useEffect(() => {
    const fetchBoothData = async () => {
      if (!id) return;
      if (supabaseUrl.includes('dummy') || supabaseUrl.includes('xyz.supabase.co')) {
        setIsLoading(false);
        return;
      }
      try {
        // 1. Try fetching from the new unified 'booths' table via company_id or booth id
        const { data: boothData, error: _bError } = await supabase
          .from('booths')
          .select('*, company:companies(*)')
          .or(`id.eq.${id},company_id.eq.${id}`)
          .single();

        if (boothData) {
          const internalCategory = boothData.images?.[0] || 'tech';
          setBooth({
            id: boothData.id,
            title: boothData.company.name,
            subtitle: boothData.company.description?.substring(0, 100) + '...',
            description: boothData.company.description,
            color: boothData.company.sector_id ? '#3b82f6' : '#8b5cf6', // Fallback color
            category: internalCategory
          });
          
          setOffers(boothData.products || []);
          setAssets(boothData.services?.map((_s: any, i: number) => ({
            id: `service-${i}`,
            booth_id: boothData.id,
            asset_type: 'portfolio',
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
          })) || []);
          
          setIsLoading(false);
          return;
        }

        // 2. Fallback to legacy 'expo_booth' table
        const { data: legacyBooth } = await supabase
          .from('expo_booth')
          .select('*, organization(*)')
          .or(`slug.eq.${id},id.eq.${id}`)
          .single();

        if (legacyBooth) {
          setBooth(legacyBooth);
          const { data: offersData } = await supabase.from('booth_offer').select('*').eq('booth_id', legacyBooth.id).order('sort_order');
          setOffers(offersData || []);
          const { data: assetsData } = await supabase.from('booth_asset').select('*').eq('booth_id', legacyBooth.id);
          setAssets(assetsData || []);
        }
      } catch (err) { 
        console.error("Error fetching booth data:", err);
      }
      setIsLoading(false);
    };
    fetchBoothData();
  }, [id]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.phone) return alert("Lūdzu, aizpildiet obligātos laukus!");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('booth_lead').insert([{
        booth_id: booth?.id,
        name: leadData.name,
        phone: leadData.phone,
        message: leadData.message
      }]);

      if (!error) {
        alert("Paldies! Jūsu pieteikums ir nosūtīts uzņēmumam.");
        setShowLeadForm(false);
        setLeadData({ name: '', phone: '', message: '' });
      }
    } catch { /* ignore */ }
    setIsSubmitting(false);
  };

  if (isLoading) return <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ielādē stenda telpu...</div>;
  if (!booth) return <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Stends nav atrasts (Supabase nav konfigurēts). <Link to="/expo" style={{ color: '#3b82f6', marginLeft: '10px' }}>Atpakaļ</Link></div>;

  const color = booth.color || '#3b82f6';
  const logoAsset = assets.find(a => a.asset_type === 'logo');
  const portfolioAssets = assets.filter(a => a.asset_type === 'portfolio');

  // Fallback images to prevent CORB errors if assets are missing or invalid
  const fallbackImages = [
    'https://images.unsplash.com/photo-1541888081622-14eb023cd1d1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'
  ];

  const displayAssets = portfolioAssets.length > 0 ? portfolioAssets.map(a => a.url) : fallbackImages;

  return (
    <div style={{ width: '100vw', height: 'calc(100vh - 64px)', position: 'relative', background: '#000' }}>
      
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
        background: 'rgba(15, 23, 42, 0.9)', padding: '25px', borderRadius: '16px',
        border: `2px solid ${color}`, color: '#fff', width: '380px',
        backdropFilter: 'blur(15px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <Link to="/expo" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>← Atpakaļ uz Lielo Halli</Link>
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {logoAsset && <img src={logoAsset.url} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} alt="Logo" />}
          <h1 style={{ color: color, margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>{booth.title}</h1>
        </div>
        <p style={{ fontStyle: 'italic', color: '#cbd5e1', margin: '10px 0 20px 0', fontSize: '0.9rem', opacity: 0.8 }}>"{booth.subtitle}"</p>
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
          <p style={{ lineHeight: '1.6', fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '25px' }}>{booth.description || "Šis uzņēmums vēl nav pievienojis aprakstu."}</p>
          {offers.length > 0 && (
            <>
              <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>Īpašie Piedāvājumi</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {offers.map((offer) => (
                  <li key={offer.id} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>{offer.title}</span><span style={{ color: color }}>{offer.price}</span></div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '5px 0 0 0' }}>{offer.description}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <button onClick={() => setShowLeadForm(true)} style={{ width: '100%', padding: '15px', background: color, color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', marginTop: '25px', cursor: 'pointer', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: `0 10px 20px ${color}33` }}>Sazināties ar Meistaru</button>
      </div>

      {showLeadForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <form onSubmit={handleLeadSubmit} style={{ background: '#1e293b', padding: '40px', borderRadius: '20px', width: '450px', border: `2px solid ${color}` }}>
            <h2 style={{ color: '#fff', marginBottom: '10px' }}>Pieteikt darbu</h2>
            <input type="text" placeholder="Jūsu Vārds" required value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
            <input type="text" placeholder="Telefona numurs" required value={leadData.phone} onChange={e => setLeadData({...leadData, phone: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
            <textarea placeholder="Īss darba apraksts..." rows={4} value={leadData.message} onChange={e => setLeadData({...leadData, message: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '15px', background: color, color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isSubmitting ? "Sūta..." : "NOSŪTĪT PIETEIKUMU"}</button>
            <button type="button" onClick={() => setShowLeadForm(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', marginTop: '10px', cursor: 'pointer' }}>Atcelt</button>
          </form>
        </div>
      )}

      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 1.5, 7], fov: 45 }}>
        <Suspense fallback={null}>
          <Bvh firstHitOnly>
            <Sky sunPosition={[100, 10, 100]} turbidity={0.1} rayleigh={0.5} />
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls enableZoom={true} maxDistance={15} minDistance={3} maxPolarAngle={Math.PI/2 - 0.1} />
            <ambientLight intensity={0.5} />
            <Environment preset="city" />
            <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={5} color={color} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <MeshReflectorMaterial blur={[300, 50]} resolution={256} mixBlur={1} mixStrength={0.5} roughness={1} depthScale={1} color="#e2e8f0" metalness={0.02} mirror={0.2} />
            </mesh>
            <SkyWindow />
            {booth.category === 'building' || booth.category === 'industrial' ? <ConstructionInteriors /> : null}
            {booth.category === 'tech' || booth.category === 'digital' ? <TechInteriors color={color} /> : null}
            {booth.category === 'emergency' ? <SOSInteriors color={color} /> : null}
            {booth.category === 'design' || booth.category === 'luxury' ? <DesignInteriors /> : null}
            <mesh position={[0, 3, -5]} receiveShadow castShadow><boxGeometry args={[16, 8, 0.5]} /><meshPhysicalMaterial color="#fff" metalness={0.2} roughness={0.1} clearcoat={1} /></mesh>
            <Text position={[0, 4.5, -4.7]} fontSize={1} color={color} fontWeight={900}>{booth.title}</Text>
            <Text position={[0, 3.8, -4.7]} fontSize={0.4} color="#64748b" maxWidth={12}>"{booth.subtitle}"</Text>
            {/* Portfolio Gallery Sliders */}
            <group position={[0, 2, -4.7]}>
              <Html position={[0, 0, 0]} center transform occlude="blending">
                <div style={{ display: 'flex', gap: '20px' }}>
                  {displayAssets.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${color}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} alt="Portfolio" />
                  ))}
                </div>
              </Html>
            </group>
            <mesh position={[0, 0.5, -1]} castShadow receiveShadow><cylinderGeometry args={[1.5, 1.8, 1, 32]} /><meshPhysicalMaterial color="#fff" metalness={0.2} roughness={0.05} clearcoat={1} /></mesh>
            <group position={[0, 2, -1]}><Float speed={2} rotationIntensity={1} floatIntensity={1}><mesh castShadow><torusKnotGeometry args={[0.5, 0.15, 128, 16]} /><meshPhysicalMaterial color={color} metalness={0.2} roughness={0} emissive={color} emissiveIntensity={1} clearcoat={1} /></mesh></Float></group>
            <ContactShadows resolution={512} scale={20} blur={2} opacity={0.4} far={10} color="#000" />
            <EffectComposer><Bloom luminanceThreshold={1} mipmapBlur intensity={0.8} /><ChromaticAberration offset={new THREE.Vector2(0.0004, 0.0004)} /><Noise opacity={0.01} /></EffectComposer>
          </Bvh>
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: '#475569', fontSize: '0.8rem', pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>IZMANTOJIET PELI, LAI GROZĪTU TELPU</div>
      {showAutopilot && (
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 20, background: 'rgba(15, 23, 42, 0.95)', border: `2px solid ${color}`, borderRadius: '16px', width: '350px', display: 'flex', flexDirection: 'column', boxShadow: `0 0 30px ${color}66`, backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
          <div style={{ background: color, padding: '10px 15px', color: '#000', fontWeight: '900', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>⚡ PRO AUTOPILOT AI</span><button onClick={() => setShowAutopilot(false)} style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>✕</button></div>
          <div style={{ padding: '15px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>{chatMessages.map((msg, idx) => (<div key={idx} style={{ alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end', background: msg.role === 'ai' ? 'rgba(255,255,255,0.1)' : color, color: msg.role === 'ai' ? '#fff' : '#000', padding: '10px 15px', borderRadius: '12px', borderBottomLeftRadius: msg.role === 'ai' ? '2px' : '12px', borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</div>))}<div ref={chatEndRef} /></div>
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #334155', background: '#0f172a' }}><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Jūsu jautājums..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff', outline: 'none' }} /><button type="submit" style={{ background: color, color: '#000', border: 'none', padding: '0 15px', marginLeft: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sūtīt</button></form>
        </div>
      )}
    </div>
  );
}
