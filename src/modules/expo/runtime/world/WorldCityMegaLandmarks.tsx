type WorldCityMegaLandmarksProps = {
  districtCount: number;
  districtStride: number;
  sectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  };
};

function LandmarkMaterial({
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      metalness={0.12}
      roughness={0.42}
    />
  );
}

export function WorldCityMegaLandmarks({
  districtCount,
  districtStride,
  sectionToggles = { arrival: true, left: true, middle: true, right: true },
}: WorldCityMegaLandmarksProps) {
  const hiddenLandmarkParts = new Set([
    'mega-landmark:arrival-base',
    'mega-landmark:arrival-plinth',
    'mega-landmark:arrival-core',
    'mega-landmark:arrival-support-left',
    'mega-landmark:arrival-support-right',
    'mega-landmark:arrival-accent-left',
    'mega-landmark:arrival-accent-right',
    'mega-landmark:showcase-side-accent-right',
    'mega-landmark:media-spire-left',
    'mega-landmark:showcase-side-accent-left',
    'mega-landmark:media-base',
    'mega-landmark:media-plinth',
    'mega-landmark:media-support-left',
    'mega-landmark:media-support-right',
    'mega-landmark:media-spire-right',
    'mega-landmark:media-side-accent-right',
    'mega-landmark:media-side-accent-left',
    'mega-landmark:discovery-base',
    'mega-landmark:discovery-plinth',
    'mega-landmark:discovery-support-left',
    'mega-landmark:discovery-support-right',
    'mega-landmark:discovery-outer-accent-left',
    'mega-landmark:discovery-outer-accent-right',
    'mega-landmark:discovery-side-accent-left',
    'mega-landmark:discovery-side-accent-right',
  ]);
  const arrivalBaseZ = 256;
  const showcaseBaseZ = -72;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;
  const mediaBaseZ = -214 - districtStride - 56;

  return (
    <group name="world-city-mega-landmarks">
      {sectionToggles.arrival && <group name="mega-landmark:arrival" position={[0, 0, arrivalBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:arrival-base') && (
        <mesh name="mega-landmark:arrival-base" position={[0, 8, 0]}>
          <boxGeometry args={[148, 6, 22]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        <mesh name="mega-landmark:arrival-ring-outer" position={[0, 174, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[112, 12, 16, 48]} />
          <LandmarkMaterial color="#e2edf4" emissive="#67e8f9" emissiveIntensity={0.08} />
        </mesh>
        <mesh name="mega-landmark:arrival-ring-inner" position={[0, 126, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[74, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh name="mega-landmark:arrival-core" position={[0, 54, 0]}>
          <cylinderGeometry args={[8, 12, 108, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        <mesh name="mega-landmark:arrival-support-left" position={[-148, 102, 0]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        <mesh name="mega-landmark:arrival-support-right" position={[148, 102, 0]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:arrival-plinth') && (
        <mesh name="mega-landmark:arrival-plinth" position={[0, 12, 0]}>
          <boxGeometry args={[84, 6, 12]} />
          <LandmarkMaterial color="#d9e4eb" />
        </mesh>
        )}
        <mesh name="mega-landmark:arrival-accent-left" position={[-92, 46, 18]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh name="mega-landmark:arrival-accent-right" position={[92, 46, 12]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
      </group>}

      {sectionToggles.middle && <group name="mega-landmark:showcase" position={[0, 0, showcaseBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:showcase-base') && (
        <mesh name="mega-landmark:showcase-base" position={[0, 12, 0]}>
          <boxGeometry args={[176, 10, 20]} />
          <LandmarkMaterial color="#f2f7fa" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
        )}
        <mesh name="mega-landmark:showcase-plinth" position={[0, 18, -6]}>
          <boxGeometry args={[132, 10, 20]} />
          <LandmarkMaterial color="#dde7ed" />
        </mesh>
        <mesh name="mega-landmark:showcase-ring-outer" position={[0, 162, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[122, 10, 16, 42]} />
          <LandmarkMaterial color="#f3f7fa" emissive="#c084fc" emissiveIntensity={0.1} />
        </mesh>
        <mesh name="mega-landmark:showcase-ring-inner" position={[0, 118, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[82, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        <mesh name="mega-landmark:showcase-beam" position={[0, 78, 0]}>
          <boxGeometry args={[138, 10, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.03} />
        </mesh>
        <mesh name="mega-landmark:showcase-inner-support-left" position={[-66, 38, 0]}>
          <boxGeometry args={[12, 76, 12]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh name="mega-landmark:showcase-inner-support-right" position={[66, 38, 0]}>
          <boxGeometry args={[12, 76, 12]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh name="mega-landmark:showcase-support-left" position={[-168, 84, 0]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh name="mega-landmark:showcase-support-right" position={[168, 84, 0]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh name="mega-landmark:showcase-base-bar" position={[0, 10, 0]}>
          <boxGeometry args={[112, 6, 14]} />
          <LandmarkMaterial color="#dbe5eb" />
        </mesh>
        <mesh name="mega-landmark:showcase-outer-accent-left" position={[-246, 62, -12]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        <mesh name="mega-landmark:showcase-outer-accent-right" position={[246, 62, -18]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:showcase-side-accent-left') && (
        <mesh name="mega-landmark:showcase-side-accent-left" position={[-104, 44, 34]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-side-accent-right') && (
        <mesh name="mega-landmark:showcase-side-accent-right" position={[104, 44, 28]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && <group name="mega-landmark:media" position={[0, 0, mediaBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:media-base') && (
        <mesh name="mega-landmark:media-base" position={[0, 8, 0]}>
          <boxGeometry args={[228, 6, 24]} />
          <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-spire-left') && (
        <mesh name="mega-landmark:media-spire-left" position={[-382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#67e8f9" emissiveIntensity={0.1} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-spire-right') && (
        <mesh name="mega-landmark:media-spire-right" position={[382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#c084fc" emissiveIntensity={0.1} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-support-left') && (
        <mesh name="mega-landmark:media-support-left" position={[-212, 88, 0]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-support-right') && (
        <mesh name="mega-landmark:media-support-right" position={[212, 88, 0]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-plinth') && (
        <mesh name="mega-landmark:media-plinth" position={[0, 10, 0]}>
          <boxGeometry args={[92, 6, 12]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        )}
        <mesh name="mega-landmark:media-outer-accent-left" position={[-332, 54, 0]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        <mesh name="mega-landmark:media-outer-accent-right" position={[332, 54, 0]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:media-side-accent-left') && (
        <mesh name="mega-landmark:media-side-accent-left" position={[-94, 64, 32]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-side-accent-right') && (
        <mesh name="mega-landmark:media-side-accent-right" position={[94, 64, 26]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && <group name="mega-landmark:discovery" position={[0, 0, discoveryBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:discovery-base') && (
        <mesh name="mega-landmark:discovery-base" position={[0, 8, 0]}>
          <boxGeometry args={[152, 6, 20]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        <mesh name="mega-landmark:discovery-ring-outer" position={[0, 154, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[118, 12, 18, 48]} />
          <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.12} />
        </mesh>
        <mesh name="mega-landmark:discovery-ring-inner" position={[0, 112, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[78, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        
        <mesh name="mega-landmark:discovery-core" position={[0, 72, -24]}>
          <cylinderGeometry args={[12, 18, 144, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:discovery-support-left') && (
        <mesh name="mega-landmark:discovery-support-left" position={[-146, 78, 18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-support-right') && (
        <mesh name="mega-landmark:discovery-support-right" position={[146, 78, 18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-plinth') && (
        <mesh name="mega-landmark:discovery-plinth" position={[0, 10, 0]}>
          <boxGeometry args={[82, 6, 12]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-outer-accent-left') && (
        <mesh name="mega-landmark:discovery-outer-accent-left" position={[-214, 54, 12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-outer-accent-right') && (
        <mesh name="mega-landmark:discovery-outer-accent-right" position={[214, 54, 12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-side-accent-left') && (
        <mesh name="mega-landmark:discovery-side-accent-left" position={[-98, 46, 30]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-side-accent-right') && (
        <mesh name="mega-landmark:discovery-side-accent-right" position={[98, 46, 26]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

    </group>
  );
}
