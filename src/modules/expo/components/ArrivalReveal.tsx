import { Text } from '@react-three/drei';

export function ArrivalReveal() {
  return (
    <group name="arrival-reveal" position={[0, 0, 18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, -10]} receiveShadow>
        <planeGeometry args={[72, 48]} />
        <meshStandardMaterial color="#101a2d" roughness={0.84} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, -1.8]} receiveShadow>
        <ringGeometry args={[10.8, 17.2, 64]} />
        <meshStandardMaterial color="#1c2b40" emissive="#1c2b40" emissiveIntensity={0.08} transparent opacity={0.86} />
      </mesh>
      <mesh position={[0, 0.32, -4.5]} receiveShadow>
        <cylinderGeometry args={[12.8, 16.6, 0.42, 56]} />
        <meshStandardMaterial color="#152235" metalness={0.18} roughness={0.74} />
      </mesh>
      <mesh position={[0, 0.12, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.5, 4.2]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0, 12.8, -20]} castShadow>
        <boxGeometry args={[40, 1, 3.2]} />
        <meshStandardMaterial color="#07101d" metalness={0.2} roughness={0.72} />
      </mesh>
      <mesh position={[-20.5, 8.8, -20]} castShadow>
        <boxGeometry args={[2.1, 17.6, 2]} />
        <meshStandardMaterial color="#1d2b40" />
      </mesh>
      <mesh position={[20.5, 8.8, -20]} castShadow>
        <boxGeometry args={[2.1, 17.6, 2]} />
        <meshStandardMaterial color="#1d2b40" />
      </mesh>
      <mesh position={[0, 15.4, -19.6]} castShadow>
        <torusGeometry args={[21.2, 0.54, 18, 72, Math.PI]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[-13.8, 4.8, -6.6]} castShadow>
        <boxGeometry args={[1.2, 8.2, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.66} />
      </mesh>
      <mesh position={[13.8, 4.8, -6.6]} castShadow>
        <boxGeometry args={[1.2, 8.2, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.66} />
      </mesh>
      <mesh position={[0, 8.9, -5.8]} castShadow>
        <cylinderGeometry args={[1.24, 1.7, 16.2, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.7} />
      </mesh>
      <mesh position={[0, 16.1, -5.8]} castShadow>
        <octahedronGeometry args={[2.8, 0]} />
        <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.34} />
      </mesh>
      <mesh position={[0, 0.2, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 7.8, 40]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, 1.2, 6.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 2.4]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.2} transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 18.3, -18]} fontSize={0.8} color="#7dd3fc" anchorX="center" anchorY="middle">
        PREMIUM ARRIVAL SEQUENCE
      </Text>
      <Text position={[0, 15.8, -18]} fontSize={3.8} color="#f8fafc" anchorX="center" anchorY="middle">
        WARPALA SPONSOR BOULEVARD
      </Text>
      <Text position={[0, 11.8, -18.9]} fontSize={1.02} color="#bfdbfe" anchorX="center" anchorY="middle" maxWidth={44}>
        ARRIVE. DISCOVER SPONSORS. OPEN DEMOS. BOOK LIVE MEETINGS.
      </Text>
      <Text position={[0, 1.05, -3.4]} fontSize={1.05} color="#dbeafe" anchorX="center" anchorY="middle">
        START HERE
      </Text>
      <Text position={[0, 0.88, 6.5]} fontSize={0.7} color="#0f172a" anchorX="center" anchorY="middle">
        MAIN SPONSOR AXIS
      </Text>
    </group>
  );
}
