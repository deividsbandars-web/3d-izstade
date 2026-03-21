import * as THREE from "three";

export type AssetType = "building" | "booth" | "landmark" | "road" | "nature";

export interface ProcessedAsset {
  id: string;
  object: THREE.Object3D;
  width: number;
  height: number;
  depth: number;
  type: AssetType;
}

// 1. AUTO CLASSIFICATION (Noteikta pirms mērogošanas!)
function classifyOriginal(size: THREE.Vector3, name: string): AssetType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('road') || lowerName.includes('intersect')) return "road";
  if (lowerName.includes('tree') || lowerName.includes('grass') || lowerName.includes('nature') || lowerName.includes('eagle') || lowerName.includes('crow')) return "nature";
  
  // Real world logic: izmantojam oriģinālo Y augstumu
  if (size.y > 30) return "landmark";
  if (size.y > 10) return "building";
  return "booth";
}

// 2. FIX + NORMALIZE (Subtree Safe + Variable Target)
function normalizeAndFix(model: THREE.Object3D, type: AssetType) {
  model.updateWorldMatrix(true, true);

  let box = new THREE.Box3().setFromObject(model, true);
  const size = new THREE.Vector3();
  box.getSize(size);

  // Dinamisks mērķa izmērs balstoties uz tipu
  let targetSize = 20;
  if (type === "landmark") targetSize = 40;
  if (type === "building") targetSize = 20;
  if (type === "booth") targetSize = 5;
  if (type === "road") targetSize = 12; // 12m plats ceļš
  if (type === "nature") targetSize = 4 + Math.random() * 4;

  // Ceļiem un dabai primārā ir platība, ēkām - augstums
  const referenceDim = (type === "road" || type === "nature") ? Math.max(size.x, size.z) : size.y;
  const scaleMultiplier = referenceDim > 0 ? targetSize / referenceDim : 1;

  const currentScale = model.scale.clone();
  model.scale.set(
    currentScale.x * scaleMultiplier,
    currentScale.y * scaleMultiplier,
    currentScale.z * scaleMultiplier
  );

  // Pārrēķinām pēc mērogošanas
  model.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(model, true);
  box.getSize(size);

  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // SAFE SHIFT: Apply offset to children, not root! (Novērš dubultās transformācijas)
  const offset = new THREE.Vector3(center.x, box.min.y, center.z);
  model.children.forEach((child) => child.position.sub(offset));

  return { fixedModel: model, finalSize: size };
}

// 3. MATERIAL OPTIMIZATION & SHADOWS
function optimizeMaterials(model: THREE.Object3D, type: AssetType) {
  model.traverse((child: any) => {
    if (child.isMesh) {
      // 🚀 PERFORMANCE FIX: Tikai lielās ēkas met ēnas! (Ceļi un koki ir par smagu)
      if (type === "building" || type === "landmark" || type === "booth") {
        child.castShadow = true;
      } else {
        child.castShadow = false; 
      }
      
      child.receiveShadow = true;

      if (child.material && (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial)) {
        child.material.roughness = 0.7;
        child.material.metalness = 0.2;
      }
    }
  });
}

// 4. FULL PIPELINE FUNCTION
export function processAssets(models: THREE.Object3D[], names: string[]): ProcessedAsset[] {
  return models.map((model, i) => {
    // A. Sākotnējais mērījums klasifikācijai
    model.updateWorldMatrix(true, true);
    const origBox = new THREE.Box3().setFromObject(model);
    const origSize = new THREE.Vector3();
    origBox.getSize(origSize);

    // B. Klasificējam pirms iznīcinām proporcijas
    const type = classifyOriginal(origSize, names[i]);

    // C. Mērogojam un centrējam drošā veidā
    const { fixedModel, finalSize } = normalizeAndFix(model, type);

    // D. Optimizējam materiālus un ēnas atbilstoši tipam
    optimizeMaterials(fixedModel, type);

    return {
      id: `asset_${i}_${type}`,
      object: fixedModel,
      width: finalSize.x,
      height: finalSize.y,
      depth: finalSize.z,
      type,
    };
  });
}
