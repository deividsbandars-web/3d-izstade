import type { ExpoSectorMarker } from '../../layout-engine';

export function WorldDistrictGatewayNode({ marker }: { marker: ExpoSectorMarker }) {
  const style = marker.districtTheme.gatewayStyle;
  const accent = marker.color;

  return (
    <group position={marker.position}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color={marker.districtTheme.groundPalette.plaza} transparent opacity={0.14} />
      </mesh>
      {style === 'studio_portal' && (
        <>
          <mesh position={[0, 6.2, 0]} castShadow>
            <boxGeometry args={[16, 10.5, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.82} />
          </mesh>
          <mesh position={[0, 6.4, 0.68]}>
            <planeGeometry args={[13.5, 7.6]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} transparent opacity={0.16} />
          </mesh>
        </>
      )}
      {style === 'signal_frame' && (
        <>
          <mesh position={[-6, 6.4, 0]} castShadow>
            <boxGeometry args={[1.2, 11.5, 1.4]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[6, 6.4, 0]} castShadow>
            <boxGeometry args={[1.2, 11.5, 1.4]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[0, 11.3, 0]} castShadow>
            <boxGeometry args={[14.2, 1, 1.5]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </>
      )}
      {style === 'forum_arch' && (
        <>
          <mesh position={[0, 6.8, 0]} castShadow>
            <torusGeometry args={[6.1, 0.7, 18, 40, Math.PI]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} />
          </mesh>
          <mesh position={[-6.1, 3.5, 0]} castShadow>
            <boxGeometry args={[1, 7, 1.2]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh position={[6.1, 3.5, 0]} castShadow>
            <boxGeometry args={[1, 7, 1.2]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </>
      )}
      {style === 'gallery_blade' && (
        <>
          <mesh position={[0, 6.6, 0]} castShadow>
            <boxGeometry args={[4.2, 11.8, 1.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 6.6, 0.7]}>
            <planeGeometry args={[3.3, 9.8]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} transparent opacity={0.22} />
          </mesh>
        </>
      )}
      <mesh position={[0, 7.4, 1.18]}>
        <boxGeometry args={[4.8, 0.22, 0.06]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[marker.side === 'left' ? 12 : -12, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 3.2]} />
        <meshStandardMaterial color={accent} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
