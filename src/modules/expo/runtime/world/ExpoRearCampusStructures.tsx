import type { CampusPavilion, CampusTower } from './ExpoRearCampusLayout';
import { SponsorTextureSurface } from '../booths';

type CampusScreenFeed = {
  accentColor: string;
  id: string;
  imageUrl: string | null;
};

function CampusMassMaterial({
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
      roughness={0.76}
      metalness={0.05}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

export function ExpoRearCampusStructures({
  accent,
  campusCenterZ,
  enableHeavyShadows,
  screenFeeds,
  sidePavilions,
  towers,
}: {
  accent: string;
  campusCenterZ: number;
  enableHeavyShadows: boolean;
  screenFeeds: CampusScreenFeed[];
  sidePavilions: CampusPavilion[];
  towers: CampusTower[];
}) {
  const hiddenStructureIds = new Set([
    'stadium-structure:rear-campus-axis-terminal--1',
    'stadium-structure:rear-campus-axis-terminal-1',
    'stadium-structure:rear-campus-axis-center-1608',
    'stadium-structure:rear-campus-axis-center-1180',
    'stadium-structure:rear-campus-axis-beacon--1',
    'stadium-structure:rear-campus-axis-beacon-1',
    'stadium-structure:rear-campus-axis-front-node--1',
    'stadium-structure:rear-campus-axis-front-node-1',
    'stadium-structure:rear-campus-axis-pylon-1',
    'stadium-structure:rear-campus-axis-pylon--1',
    'stadium-structure:rear-campus-axis-canopy--1',
    'stadium-structure:rear-campus-forecourt-blade-1',
    'stadium-structure:rear-campus-forecourt-blade--1',
    'stadium-structure:rear-campus-event-blade-1',
    'stadium-structure:rear-campus-event-blade--1',
    'stadium-structure:rear-campus-axis-canopy-1',
    'stadium-structure:rear-campus-center-threshold--1',
    'stadium-structure:rear-campus-center-threshold-1',
    'stadium-structure:rear-campus-center-node-1',
  ]);
  const leftFeed = screenFeeds[0] ?? null;
  const rightFeed = screenFeeds[1] ?? screenFeeds[0] ?? null;
  const bowlFeed = screenFeeds[2] ?? screenFeeds[1] ?? screenFeeds[0] ?? null;

  return (
    <group position={[0, 0, campusCenterZ]}>
      {[-1, 1].map((side) => (
        <group key={`rear-campus-gateway-${side}`} name={`stadium-structure:rear-campus-gateway-${side}`} position={[side * 1260, 0, 980]}>
          <mesh position={[0, 168, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[126, 336, 126]} />
            <CampusMassMaterial color="#8095a6" />
          </mesh>
        </group>
      ))}

      <group position={[0, 0, -1520]}>
        <mesh position={[0, 208, 0]} rotation={[-0.08, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[2860, 416, 860]} />
          <CampusMassMaterial color="#9eb1bf" />
        </mesh>
        <mesh position={[0, 378, -88]} rotation={[-0.12, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[2360, 144, 580]} />
          <CampusMassMaterial color="#c9d5de" />
        </mesh>
        <mesh position={[0, 498, -146]} rotation={[-0.16, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[1880, 104, 380]} />
          <CampusMassMaterial color="#eef4f7" />
        </mesh>
        <mesh position={[0, 306, 264]}>
          <boxGeometry args={[2160, 48, 56]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} roughness={0.24} metalness={0.14} />
        </mesh>
        {bowlFeed && (
          <group position={[0, 318, 246]}>
            <mesh position={[0, 0, 0.2]}>
              <planeGeometry args={[1180, 268]} />
              <meshBasicMaterial color="#08111c" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.24]}>
              <planeGeometry args={[1110, 214]} />
              {bowlFeed.imageUrl ? (
                <SponsorTextureSurface fallbackColor={bowlFeed.accentColor} opacity={0.95} url={bowlFeed.imageUrl} />
              ) : (
                <meshBasicMaterial color={bowlFeed.accentColor} transparent opacity={0.4} />
              )}
            </mesh>
          </group>
        )}
      </group>

      {[-980, 980].map((x) => (
        <group key={`rear-campus-concourse-node-${x}`} name={`stadium-structure:rear-campus-concourse-node-${x}`} position={[x, 0, 620]}>
          <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[188, 144, 188]} />
            <CampusMassMaterial color="#a5b6c1" />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`rear-campus-concourse-gallery-${side}`} name={`stadium-structure:rear-campus-concourse-gallery-${side}`} position={[side * 612, 0, 822]}>
          <mesh position={[0, 32, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[142, 64, 52]} />
            <CampusMassMaterial color="#d7e3ea" />
          </mesh>
          <mesh position={[0, 84, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[44, 58, 14]} />
            <CampusMassMaterial color="#93a7b4" emissive={accent} emissiveIntensity={0.04} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-event-blade-${side}`)).map((side) => (
        <group key={`rear-campus-event-blade-${side}`} name={`stadium-structure:rear-campus-event-blade-${side}`} position={[side * 540, 0, 820]}>
          <mesh position={[0, 124, 0]} rotation={[0, 0, side * 0.08]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[42, 248, 24]} />
            <CampusMassMaterial color="#d8e3ea" emissive={accent} emissiveIntensity={0.06} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-forecourt-blade-${side}`)).map((side) => (
        <group key={`rear-campus-forecourt-blade-${side}`} name={`stadium-structure:rear-campus-forecourt-blade-${side}`} position={[side * 248, 0, 1260]}>
          <mesh position={[0, 112, 0]} rotation={[0, 0, side * 0.12]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[28, 224, 22]} />
            <CampusMassMaterial color="#e3edf3" emissive={accent} emissiveIntensity={0.08} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`rear-campus-entry-plinth-${side}`} name={`stadium-structure:rear-campus-entry-plinth-${side}`} position={[side * 420, 0, 1080]}>
          <mesh position={[0, 24, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[212, 48, 84]} />
            <CampusMassMaterial color="#d9e4eb" />
          </mesh>
          <mesh position={[0, 82, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[64, 92, 22]} />
            <CampusMassMaterial color="#93a7b4" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-axis-pylon-${side}`)).map((side) => (
        <group key={`rear-campus-axis-pylon-${side}`} name={`stadium-structure:rear-campus-axis-pylon-${side}`} position={[side * 188, 0, 1328]}>
          <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[18, 92, 14]} />
            <CampusMassMaterial color="#e7eef3" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-axis-canopy-${side}`)).map((side) => (
        <group key={`rear-campus-axis-canopy-${side}`} name={`stadium-structure:rear-campus-axis-canopy-${side}`} position={[side * 286, 0, 1210]}>
          <mesh position={[0, 28, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[104, 22, 52]} />
            <CampusMassMaterial color="#e4ecf1" />
          </mesh>
          <mesh position={[0, 74, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[18, 48, 14]} />
            <CampusMassMaterial color="#94a8b4" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-axis-front-node-${side}`)).map((side) => (
        <group key={`rear-campus-axis-front-node-${side}`} name={`stadium-structure:rear-campus-axis-front-node-${side}`} position={[side * 224, 0, 1258]}>
          <mesh position={[0, 22, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[46, 24, 22]} />
            <CampusMassMaterial color="#edf4f8" />
          </mesh>
          <mesh position={[0, 64, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[10, 30, 8]} />
            <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-axis-beacon-${side}`)).map((side) => (
        <group key={`rear-campus-axis-beacon-${side}`} name={`stadium-structure:rear-campus-axis-beacon-${side}`} position={[side * 156, 0, 1468]}>
          <mesh position={[0, 56, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[12, 68, 12]} />
            <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.06} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-axis-terminal-${side}`)).map((side) => (
        <group key={`rear-campus-axis-terminal-${side}`} name={`stadium-structure:rear-campus-axis-terminal-${side}`} position={[side * 238, 0, 1540]}>
          <mesh position={[0, 28, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[52, 30, 24]} />
            <CampusMassMaterial color="#e8eff4" />
          </mesh>
          <mesh position={[0, 84, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[12, 32, 10]} />
            <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
          <mesh position={[side * 24, 54, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[8, 42, 8]} />
            <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.04} />
          </mesh>
          <mesh position={[-side * 24, 52, -4]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[6, 28, 6]} />
            <CampusMassMaterial color="#dbe6ed" emissive={accent} emissiveIntensity={0.03} />
          </mesh>
        </group>
      ))}

      {!hiddenStructureIds.has('stadium-structure:rear-campus-axis-center-1608') && (
      <group name="stadium-structure:rear-campus-axis-center-1608" position={[0, 0, 1608]}>
        <mesh position={[0, 22, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[72, 22, 18]} />
          <CampusMassMaterial color="#edf4f8" />
        </mesh>
        <mesh position={[0, 10, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[112, 6, 24]} />
          <CampusMassMaterial color="#f4f8fb" emissive={accent} emissiveIntensity={0.02} />
        </mesh>
        <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[14, 30, 8]} />
          <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-92, 42, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 34, 10]} />
          <CampusMassMaterial color="#e8eff4" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[92, 42, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 34, 10]} />
          <CampusMassMaterial color="#e8eff4" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 110, -8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[10, 24, 8]} />
          <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-76, 74, -4]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[8, 46, 8]} />
          <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[76, 74, -4]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[8, 46, 8]} />
          <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
      </group>
      )}

      {!hiddenStructureIds.has('stadium-structure:rear-campus-axis-center-1180') && (
      <group name="stadium-structure:rear-campus-axis-center-1180" position={[0, 0, 1180]}>
        <mesh position={[0, 18, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[128, 18, 28]} />
          <CampusMassMaterial color="#e5edf2" />
        </mesh>
        <mesh position={[0, 74, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[28, 38, 12]} />
          <CampusMassMaterial color="#93a7b4" emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 146, -30]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[34, 32, 8]} />
          <CampusMassMaterial color="#d8e3ea" emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-154, 38, 8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 30, 10]} />
          <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[154, 38, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 30, 10]} />
          <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.04} />
        </mesh>
      </group>
      )}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-center-node-${side}`)).map((side) => (
        <group key={`rear-campus-center-node-${side}`} name={`stadium-structure:rear-campus-center-node-${side}`} position={[side * 286, 0, 928]}>
          <mesh position={[0, 32, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[128, 64, 58]} />
            <CampusMassMaterial color="#d9e4eb" />
          </mesh>
          <mesh position={[0, 86, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[34, 72, 16]} />
            <CampusMassMaterial color="#93a7b4" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].filter((side) => !hiddenStructureIds.has(`stadium-structure:rear-campus-center-threshold-${side}`)).map((side) => (
        <group key={`rear-campus-center-threshold-${side}`} name={`stadium-structure:rear-campus-center-threshold-${side}`} position={[side * 118, 0, 1042]}>
          <mesh position={[0, 18, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[74, 36, 34]} />
            <CampusMassMaterial color="#e7eef3" />
          </mesh>
          <mesh position={[0, 52, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[18, 32, 12]} />
            <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.04} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`rear-campus-axis-gallery-node-${side}`} name={`stadium-structure:rear-campus-axis-gallery-node-${side}`} position={[side * 412, 0, 1080]}>
          <mesh position={[0, 26, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[96, 52, 42]} />
            <CampusMassMaterial color="#e3ebf0" />
          </mesh>
          <mesh position={[0, 76, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[24, 56, 16]} />
            <CampusMassMaterial color="#97aab6" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`rear-campus-inner-portal-${side}`} name={`stadium-structure:rear-campus-inner-portal-${side}`} position={[side * 518, 0, 934]}>
          <mesh position={[0, 58, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[38, 116, 20]} />
            <CampusMassMaterial color="#edf4f8" emissive={accent} emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}

      {sidePavilions.map((pavilion) => (
        <group key={pavilion.id} name={`stadium-pavilion:${pavilion.id}`} position={pavilion.position}>
          <mesh position={[0, pavilion.size[1] * 0.5, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={pavilion.size} />
            <CampusMassMaterial color="#a7b8c4" />
          </mesh>
          <mesh position={[0, pavilion.size[1] + 6, pavilion.accentSide * 18]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[pavilion.size[0] * 0.62, 12, 36]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.14} roughness={0.22} metalness={0.12} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`rear-campus-terrace-${side}`} name={`stadium-structure:rear-campus-terrace-${side}`} position={[side * 560, 0, -1160]}>
          <mesh position={[0, 54, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[540, 108, 260]} />
            <CampusMassMaterial color="#a9bac5" />
          </mesh>
        </group>
      ))}

      {towers.map((tower) => (
        <group key={tower.id} name={`stadium-tower:${tower.id}`} position={tower.position}>
          <mesh position={[0, 26, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[188, 52, 146]} />
            <CampusMassMaterial color="#d8e3ea" />
          </mesh>
          <mesh position={[0, 288, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[96, 576, 96]} />
            <CampusMassMaterial color="#708596" />
          </mesh>
          <mesh position={[0, 546, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[132, 24, 132]} />
            <CampusMassMaterial color="#b7c5ce" />
          </mesh>
          {tower.id.includes('left') && leftFeed && (
            <group position={[0, 398, 30]}>
              <mesh position={[0, 0, 0.2]}>
                <planeGeometry args={[244, 152]} />
                <meshBasicMaterial color="#08111c" transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0, 0.24]}>
                <planeGeometry args={[210, 124]} />
                {leftFeed.imageUrl ? (
                  <SponsorTextureSurface fallbackColor={leftFeed.accentColor} opacity={0.94} url={leftFeed.imageUrl} />
                ) : (
                  <meshBasicMaterial color={leftFeed.accentColor} transparent opacity={0.4} />
                )}
              </mesh>
            </group>
          )}
          {tower.id.includes('right') && rightFeed && (
            <group position={[0, 398, 30]}>
              <mesh position={[0, 0, 0.2]}>
                <planeGeometry args={[244, 152]} />
                <meshBasicMaterial color="#08111c" transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0, 0.24]}>
                <planeGeometry args={[210, 124]} />
                {rightFeed.imageUrl ? (
                  <SponsorTextureSurface fallbackColor={rightFeed.accentColor} opacity={0.94} url={rightFeed.imageUrl} />
                ) : (
                  <meshBasicMaterial color={rightFeed.accentColor} transparent opacity={0.4} />
                )}
              </mesh>
            </group>
          )}
          <mesh position={[0, 654, 0]} castShadow={enableHeavyShadows}>
            <boxGeometry args={[52, 14, 52]} />
            <meshStandardMaterial color="#d8e3ea" metalness={0.12} roughness={0.34} />
          </mesh>
          <mesh position={[0, 694, 0]} castShadow={enableHeavyShadows}>
            <boxGeometry args={[16, 62, 16]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} roughness={0.2} metalness={0.14} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
