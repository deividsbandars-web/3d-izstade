import { Text } from '@react-three/drei';

export function ArrivalReveal() {
  return (
    <group name="arrival-reveal" position={[0, 0, 18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, -10]} receiveShadow>
        <planeGeometry args={[62, 42]} />
        <meshStandardMaterial color="#101a2d" roughness={0.84} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.32, -4.5]} receiveShadow>
        <cylinderGeometry args={[11.8, 15.2, 0.4, 48]} />
        <meshStandardMaterial color="#152235" metalness={0.18} roughness={0.74} />
      </mesh>
      <mesh position={[0, 12.4, -20]} castShadow>
        <boxGeometry args={[36, 1, 3.2]} />
        <meshStandardMaterial color="#07101d" metalness={0.2} roughness={0.72} />
      </mesh>
      <mesh position={[-18.5, 8.5, -20]} castShadow>
        <boxGeometry args={[2, 17, 2]} />
        <meshStandardMaterial color="#1d2b40" />
      </mesh>
      <mesh position={[18.5, 8.5, -20]} castShadow>
        <boxGeometry args={[2, 17, 2]} />
        <meshStandardMaterial color="#1d2b40" />
      </mesh>
      <mesh position={[0, 15, -19.6]} castShadow>
        <torusGeometry args={[19.4, 0.5, 18, 72, Math.PI]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 8.4, -5.8]} castShadow>
        <cylinderGeometry args={[1.2, 1.65, 15.5, 20]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.7} />
      </mesh>
      <mesh position={[0, 15.6, -5.8]} castShadow>
        <octahedronGeometry args={[2.8, 0]} />
        <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.2, 6.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 2.4]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.2} transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 15.8, -18]} fontSize={3.6} color="#f8fafc" anchorX="center" anchorY="middle">
        WARPALA SPONSOR BOULEVARD
      </Text>
      <Text position={[0, 11.9, -18.9]} fontSize={1.02} color="#bfdbfe" anchorX="center" anchorY="middle" maxWidth={42}>
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
