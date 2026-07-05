import { Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import type { ExpoCalculatorCatalogItem } from '../../../../app/expo/expoCalculatorCatalog';
import { getExpoCalculatorCatalog } from '../../../../app/expo/expoCalculatorCatalog';

function openCalculator(event: ThreeEvent<MouseEvent>, route: string) {
  event.stopPropagation();
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(route);
}

function WorldCalculatorKiosk({ item }: { item: ExpoCalculatorCatalogItem }) {
  return (
    <group
      onClick={(event) => openCalculator(event, item.route)}
      position={item.kioskPosition}
      rotation={[0, item.kioskRotationY, 0]}
    >
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[1.45, 1.72, 0.18, 12]} />
        <meshStandardMaterial color="#111827" roughness={0.84} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.08, 10]} />
        <meshStandardMaterial color={item.accent} emissive={item.accent} emissiveIntensity={0.3} roughness={0.5} metalness={0.18} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[2.92, 2.08, 0.24]} />
        <meshStandardMaterial color="#101827" emissive="#07111f" emissiveIntensity={0.34} roughness={0.74} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.55, 0.14]}>
        <planeGeometry args={[2.52, 1.58]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} transparent opacity={0.22} />
      </mesh>
      <mesh position={[-1.38, 2.46, 0.16]}>
        <boxGeometry args={[0.16, 0.38, 0.08]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} />
      </mesh>
      <mesh position={[1.38, 2.46, 0.16]}>
        <boxGeometry args={[0.16, 0.38, 0.08]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} />
      </mesh>
      <Text anchorX="center" color={item.accent} fontSize={0.18} fontWeight={900} maxWidth={2.35} position={[0, 2.15, 0.18]}>
        CALCULATOR
      </Text>
      <Text anchorX="center" color="#f8fafc" fontSize={0.34} fontWeight={900} lineHeight={1.02} maxWidth={2.35} position={[0, 1.73, 0.18]}>
        {item.shortTitle}
      </Text>
      <Text anchorX="center" color="#cbd5e1" fontSize={0.15} lineHeight={1.12} maxWidth={2.24} position={[0, 1.2, 0.18]}>
        {item.cityZoneLabel}
      </Text>
      <Text anchorX="center" color="#fef3c7" fontSize={0.14} fontWeight={800} maxWidth={2.3} position={[0, 0.86, 0.18]}>
        TAP TO ESTIMATE
      </Text>
      <mesh position={[0, 2.72, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.12, 16]} />
        <meshStandardMaterial color={item.accent} emissive={item.accent} emissiveIntensity={0.42} roughness={0.42} metalness={0.16} />
      </mesh>
    </group>
  );
}

export function WorldCalculatorKiosks() {
  const catalog = useMemo(() => getExpoCalculatorCatalog(), []);

  return (
    <group name="expo-calculator-kiosks">
      {catalog.map((item) => (
        <WorldCalculatorKiosk item={item} key={item.id} />
      ))}
    </group>
  );
}
