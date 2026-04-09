type WorldCityMegaLandmarksProps = {
  districtCount: number;
  districtStride: number;
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
}: WorldCityMegaLandmarksProps) {
  const arrivalBaseZ = 256;
  const showcaseBaseZ = -72;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;
  const mediaBaseZ = -214 - districtStride - 56;

  return (
    <group name="world-city-mega-landmarks">
      <group position={[0, 0, arrivalBaseZ]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[268, 8, 54]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        <mesh position={[0, 14, -12]}>
          <boxGeometry args={[196, 6, 26]} />
          <LandmarkMaterial color="#dce7ed" />
        </mesh>
        <mesh position={[0, 174, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[112, 12, 16, 48]} />
          <LandmarkMaterial color="#e2edf4" emissive="#67e8f9" emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 126, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[74, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 74, 0]}>
          <cylinderGeometry args={[8, 12, 108, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        <mesh position={[-148, 102, 0]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        <mesh position={[148, 102, 0]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[188, 12, 32]} />
          <LandmarkMaterial color="#d9e4eb" />
        </mesh>
        <mesh position={[0, 20, 0]}>
          <boxGeometry args={[228, 4, 56]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[0, 38, -42]}>
          <boxGeometry args={[136, 18, 22]} />
          <LandmarkMaterial color="#e8eff4" />
        </mesh>
        <mesh position={[-92, 46, 18]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[92, 46, 12]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-212, 38, 8]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[10, 76, 10]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[212, 38, 0]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[10, 76, 10]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-262, 26, 18]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[10, 52, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#67e8f9" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[262, 26, 10]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[10, 52, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#67e8f9" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[-318, 18, 26]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[318, 18, 16]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
      </group>

      <group position={[0, 0, showcaseBaseZ]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[322, 8, 48]} />
          <LandmarkMaterial color="#f2f7fa" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[0, 14, 12]}>
          <boxGeometry args={[236, 6, 24]} />
          <LandmarkMaterial color="#e2ebf1" />
        </mesh>
        <mesh position={[0, 162, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[122, 10, 16, 42]} />
          <LandmarkMaterial color="#f3f7fa" emissive="#c084fc" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 118, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[82, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 58, -42]}>
          <cylinderGeometry args={[8, 12, 88, 18]} />
          <LandmarkMaterial color="#93a7b4" />
        </mesh>
        <mesh position={[-168, 84, 0]} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh position={[168, 84, 0]} rotation={[0, 0, -0.22]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[244, 10, 28]} />
          <LandmarkMaterial color="#dbe5eb" />
        </mesh>
        <mesh position={[0, 18, 0]}>
          <boxGeometry args={[286, 4, 54]} />
          <LandmarkMaterial color="#f4f8fb" emissive="#c084fc" emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[0, 24, 68]}>
          <boxGeometry args={[148, 10, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        <mesh position={[-246, 62, -12]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[246, 62, -18]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[-104, 44, 34]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[104, 44, 28]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-314, 34, 10]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[10, 68, 10]} />
          <LandmarkMaterial color="#f3f7fa" emissive="#c084fc" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[314, 34, 2]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[10, 68, 10]} />
          <LandmarkMaterial color="#f3f7fa" emissive="#c084fc" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-356, 24, 12]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[10, 52, 10]} />
          <LandmarkMaterial color="#f6fafc" emissive="#c084fc" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[356, 24, 6]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[10, 52, 10]} />
          <LandmarkMaterial color="#f6fafc" emissive="#c084fc" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[-404, 18, 18]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[404, 18, 10]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
      </group>

      <group position={[0, 0, mediaBaseZ]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[384, 8, 42]} />
          <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        <mesh position={[0, 16, 18]}>
          <boxGeometry args={[282, 6, 18]} />
          <LandmarkMaterial color="#dde7ed" />
        </mesh>
        <mesh position={[-382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#67e8f9" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#c084fc" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 168, 0]}>
          <boxGeometry args={[816, 12, 18]} />
          <LandmarkMaterial color="#eff5f8" />
        </mesh>
        <mesh position={[0, 142, 0]}>
          <boxGeometry args={[562, 8, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#a78bfa" emissiveIntensity={0.035} />
        </mesh>
        <mesh position={[0, 28, -54]}>
          <cylinderGeometry args={[14, 14, 44, 16]} />
          <LandmarkMaterial color="#93a7b4" />
        </mesh>
        <mesh position={[-212, 88, 0]} rotation={[0, 0, 0.16]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        <mesh position={[212, 88, 0]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[296, 12, 32]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        <mesh position={[0, 18, 0]}>
          <boxGeometry args={[352, 4, 62]} />
          <LandmarkMaterial color="#f1f6f9" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[0, 22, 86]}>
          <boxGeometry args={[164, 8, 14]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        <mesh position={[-332, 54, 0]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[332, 54, 0]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[-94, 64, 32]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[94, 64, 26]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-448, 52, 14]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[12, 104, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[448, 52, 6]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[12, 104, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-536, 28, 16]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[10, 58, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#67e8f9" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[536, 28, 8]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[10, 58, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#c084fc" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[-604, 18, 18]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[8, 42, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[604, 18, 10]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[8, 42, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
      </group>

      <group position={[0, 0, discoveryBaseZ]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[278, 8, 46]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        <mesh position={[0, 14, 14]}>
          <boxGeometry args={[208, 6, 22]} />
          <LandmarkMaterial color="#dde7ed" />
        </mesh>
        <mesh position={[0, 154, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[118, 12, 18, 48]} />
          <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 112, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[78, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 188, 0]}>
          <boxGeometry args={[164, 10, 28]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        <mesh position={[0, 84, -24]}>
          <cylinderGeometry args={[12, 18, 144, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        <mesh position={[-146, 78, 18]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh position={[146, 78, 18]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[214, 10, 30]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        <mesh position={[0, 18, 0]}>
          <boxGeometry args={[248, 4, 56]} />
          <LandmarkMaterial color="#f2f7fa" emissive="#67e8f9" emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 26, 44]}>
          <boxGeometry args={[164, 10, 18]} />
          <LandmarkMaterial color="#e6edf2" />
        </mesh>
        <mesh position={[-214, 54, 12]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[214, 54, 12]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[-98, 46, 30]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[98, 46, 26]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-286, 38, 18]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[10, 72, 10]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[286, 38, 10]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[10, 72, 10]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-334, 24, 18]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[10, 54, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#67e8f9" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[334, 24, 10]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[10, 54, 10]} />
          <LandmarkMaterial color="#f5f9fb" emissive="#67e8f9" emissiveIntensity={0.03} />
        </mesh>
        <mesh position={[-388, 18, 22]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[388, 18, 14]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[8, 38, 8]} />
          <LandmarkMaterial color="#fbfdfe" emissive="#67e8f9" emissiveIntensity={0.02} />
        </mesh>
      </group>

    </group>
  );
}
