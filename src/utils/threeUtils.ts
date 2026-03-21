import * as THREE from 'three';

/**
 * PURE NORMALIZATION ENGINE
 * 1. Atrod modeļa patieso centru un apakšu.
 * 2. Nobīda IEKŠĒJO scēnu tā, lai (0,0,0) būtu modeļa pamatnes centrā.
 * 3. Neizmanto nekādus world-space hackus.
 */
export const normalizeModel = (model: THREE.Object3D, targetSize?: number) => {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  
  box.getCenter(center);
  box.getSize(size);

  // LOKĀLĀ NOBĪDE: 
  // Mēs neaiztiekam model.position, mēs aiztiekam bērnu elementus, 
  // lai to vizuālais centrs sakristu ar modeļa lokālo nulli.
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Šis ir kritiski: mēs nobīdām ģeometriju vai bērnus, 
      // nevis pašu konteineru, ko kontrolē SceneManager.
    }
  });

  // Vieglākais veids: ielikt scēnu jaunā grupā un nobīdīt to grupu
  const pivot = new THREE.Group();
  pivot.name = "NormalizedPivot";
  
  // Aprēķinām nobīdi
  const offsetX = -center.x;
  const offsetY = -box.min.y; // Šis garantē pamatni uz 0
  const offsetZ = -center.z;

  // Pārvietojam visus bērnus
  const children = [...model.children];
  children.forEach(child => {
    child.position.x += offsetX;
    child.position.y += offsetY;
    child.position.z += offsetZ;
  });

  if (targetSize) {
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);
    }
  }

  console.log(`[Normalized] ${model.name || 'Model'}: Base at Y=0, Centered on X/Z.`);
  return { size, center };
};
