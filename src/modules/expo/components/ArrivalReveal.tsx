function ArrivalConcreteMaterial({
  color = '#e8eef4',
  roughness = 0.7,
  metalness = 0.05,
}: {
  color?: string;
  roughness?: number;
  metalness?: number;
}) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

function ArrivalMetalMaterial({
  color = '#5f7286',
  roughness = 0.56,
}: {
  color?: string;
  roughness?: number;
}) {
  return <meshStandardMaterial color={color} metalness={0.22} roughness={roughness} />;
}

export function ArrivalReveal() {
  return (
    <group name="arrival-reveal" position={[0, 0, 18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -10]} receiveShadow>
        <planeGeometry args={[92, 64]} />
        <ArrivalConcreteMaterial color="#eef3f7" roughness={0.76} metalness={0.04} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -6]} receiveShadow>
        <planeGeometry args={[18, 52]} />
        <ArrivalConcreteMaterial color="#dde5ed" roughness={0.58} metalness={0.06} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -8]} receiveShadow>
        <ringGeometry args={[10.8, 17.2, 72]} />
        <ArrivalMetalMaterial color="#94a8bc" roughness={0.52} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 5.8]}>
        <planeGeometry args={[10.8, 18]} />
        <meshStandardMaterial color="#94d8ff" emissive="#94d8ff" emissiveIntensity={0.08} transparent opacity={0.18} />
      </mesh>

      <mesh position={[-13.8, 2.8, 6.4]} castShadow>
        <boxGeometry args={[1.2, 5.6, 12.4]} />
        <ArrivalMetalMaterial color="#314556" roughness={0.64} />
      </mesh>
      <mesh position={[13.8, 2.8, 6.4]} castShadow>
        <boxGeometry args={[1.2, 5.6, 12.4]} />
        <ArrivalMetalMaterial color="#314556" roughness={0.64} />
      </mesh>
      <mesh position={[-9.8, 1.25, 3.2]} castShadow>
        <boxGeometry args={[6.4, 2.5, 6.2]} />
        <ArrivalConcreteMaterial color="#e5ebf1" roughness={0.62} metalness={0.03} />
      </mesh>
      <mesh position={[9.8, 1.25, 3.2]} castShadow>
        <boxGeometry args={[6.4, 2.5, 6.2]} />
        <ArrivalConcreteMaterial color="#e5ebf1" roughness={0.62} metalness={0.03} />
      </mesh>

      <mesh position={[-16.5, 7.6, -17.4]} castShadow>
        <boxGeometry args={[2.2, 15.2, 2.4]} />
        <ArrivalMetalMaterial color="#243849" roughness={0.58} />
      </mesh>
      <mesh position={[16.5, 7.6, -17.4]} castShadow>
        <boxGeometry args={[2.2, 15.2, 2.4]} />
        <ArrivalMetalMaterial color="#243849" roughness={0.58} />
      </mesh>
      <mesh position={[0, 12.5, -17.4]} castShadow>
        <boxGeometry args={[35.8, 1.1, 2.8]} />
        <ArrivalMetalMaterial color="#2b4255" roughness={0.54} />
      </mesh>
      <mesh position={[0, 14.1, -16.6]}>
        <planeGeometry args={[22, 3]} />
        <meshStandardMaterial color="#8ecfff" emissive="#8ecfff" emissiveIntensity={0.14} transparent opacity={0.13} />
      </mesh>

      <mesh position={[0, 2.4, -5.2]} castShadow>
        <cylinderGeometry args={[1.1, 1.6, 8.4, 24]} />
        <ArrivalMetalMaterial color="#31485b" roughness={0.56} />
      </mesh>
      <mesh position={[0, 7.2, -5.2]} castShadow>
        <octahedronGeometry args={[1.9, 0]} />
        <meshStandardMaterial color="#b8ddff" emissive="#7bc7ff" emissiveIntensity={0.18} />
      </mesh>

      <mesh position={[0, 0.12, 10.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.8, 0.52]} />
        <meshBasicMaterial color="#8ed6ff" transparent opacity={0.14} />
      </mesh>
      <mesh position={[0, 0.12, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.6, 0.32]} />
        <meshBasicMaterial color="#8ed6ff" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, 0.12, -12.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.8, 0.24]} />
        <meshBasicMaterial color="#8ed6ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
