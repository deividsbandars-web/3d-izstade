export function HeroOrEliteHalo({
  accentColor,
  haloHeight,
  haloWidth,
  haloZ,
  isHero,
}: {
  accentColor: string;
  haloHeight: number;
  haloWidth: number;
  haloZ: number;
  isHero: boolean;
}) {
  const frameWidth = isHero ? haloWidth : haloWidth - 1.2;

  return (
    <group position={[0, (haloHeight * 0.5) + (isHero ? 0.52 : 0.38), haloZ]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[frameWidth, 0.28, 0.32]} />
        <meshStandardMaterial color="#cbd8e3" metalness={0.16} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[frameWidth - (isHero ? 1.1 : 0.9), 0.1, 0.14]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} roughness={0.28} metalness={0.12} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`halo-leg-${side}`} position={[side * ((frameWidth * 0.5) - 0.14), -(haloHeight * 0.5), 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, isHero ? haloHeight : haloHeight - 1.1, 0.32]} />
            <meshStandardMaterial color="#cbd8e3" metalness={0.16} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.1, isHero ? haloHeight - 1.1 : haloHeight - 2.1, 0.14]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.26} metalness={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PremiumPortalShell({
  accentColor,
  premiumPortalHeight,
  premiumPortalWidth,
}: {
  accentColor: string;
  premiumPortalHeight: number;
  premiumPortalWidth: number;
}) {
  return (
    <group position={[0, premiumPortalHeight * 0.5, 2.4]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[premiumPortalWidth, 0.28, 0.34]} />
        <meshStandardMaterial color="#d8e4ec" metalness={0.16} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[premiumPortalWidth - 0.9, 0.12, 0.14]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.22} metalness={0.12} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`premium-portal-leg-${side}`} position={[side * ((premiumPortalWidth * 0.5) - 0.26), -(premiumPortalHeight * 0.5), 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.52, premiumPortalHeight, 0.34]} />
            <meshStandardMaterial color="#d8e4ec" metalness={0.16} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <boxGeometry args={[0.16, premiumPortalHeight - 1.2, 0.12]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.2} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function EliteMonolithShell({
  accentColor,
  depth,
  eliteMonolithHeight,
  eliteMonolithOffsetX,
  eliteMonolithZ,
  width,
}: {
  accentColor: string;
  depth: number;
  eliteMonolithHeight: number;
  eliteMonolithOffsetX: number;
  eliteMonolithZ: number;
  width: number;
}) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={`elite-monolith-${side}`} position={[side * eliteMonolithOffsetX, eliteMonolithHeight * 0.5, eliteMonolithZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.22, eliteMonolithHeight, depth * 0.42]} />
            <meshStandardMaterial color="#d9e5ed" metalness={0.18} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0.18]}>
            <boxGeometry args={[0.22, eliteMonolithHeight - 1.1, depth * 0.18]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.22} roughness={0.18} metalness={0.12} />
          </mesh>
        </group>
      ))}
      <group position={[0, eliteMonolithHeight + 0.44, eliteMonolithZ + 0.12]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width + 7.2, 0.42, 0.46]} />
          <meshStandardMaterial color="#dbe7ee" metalness={0.18} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.14]}>
          <boxGeometry args={[width + 6.2, 0.16, 0.16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.22} roughness={0.16} metalness={0.12} />
        </mesh>
      </group>
    </group>
  );
}

export function EliteRoofCrown({
  accentColor,
  depth,
  postHeight,
  width,
}: {
  accentColor: string;
  depth: number;
  postHeight: number;
  width: number;
}) {
  return (
    <group position={[0, postHeight + 1.22, 0.18]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width * 0.72, 0.18, depth * 0.26]} />
        <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[width * 0.64, 0.08, depth * 0.18]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.22} metalness={0.12} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`elite-crown-fin-${side}`} position={[side * (width * 0.24), 0.72, 0]}>
          <mesh castShadow receiveShadow rotation={[0, 0, side < 0 ? 0.16 : -0.16]}>
            <boxGeometry args={[0.22, 1.28, depth * 0.16]} />
            <meshStandardMaterial color="#d8e5ee" metalness={0.14} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.08]} rotation={[0, 0, side < 0 ? 0.16 : -0.16]}>
            <boxGeometry args={[0.08, 1.02, depth * 0.1]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.2} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PremiumOrEliteBlades({
  accentColor,
  isElite,
  postHeight,
  postOffsetX,
  postOffsetZ,
}: {
  accentColor: string;
  isElite: boolean;
  postHeight: number;
  postOffsetX: number;
  postOffsetZ: number;
}) {
  return (
    <>
      <mesh position={[-postOffsetX, postHeight * 0.76, postOffsetZ - 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.18, isElite ? 3.4 : 2.4, 1.1]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isElite ? 0.18 : 0.12} roughness={0.3} metalness={0.14} />
      </mesh>
      <mesh position={[postOffsetX, postHeight * 0.76, postOffsetZ - 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.18, isElite ? 3.4 : 2.4, 1.1]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isElite ? 0.18 : 0.12} roughness={0.3} metalness={0.14} />
      </mesh>
    </>
  );
}
