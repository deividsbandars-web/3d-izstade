import * as THREE from "three";

/**
 * AUTO-FIX PIPELINE (Pro Level)
 * Pielāgots no tava dizaina, bet ar "Subtree-safe" aizsardzību, 
 * lai novērstu "Double Transform" kļūdas, kuras tu atklāji iepriekš.
 */
export function fixModel(model: THREE.Object3D) {
  // 1. Drošības flags, lai ne-fixotu divreiz
  if (model.userData.__fixed) return model;
  model.userData.__fixed = true;

  model.updateWorldMatrix(true, true);

  let box = new THREE.Box3().setFromObject(model, true);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  // 3. Normalizē scale pēc AUGSTUMA (tavs ieteikums ēkām)
  // Ne-ēkām (piem., ielām) mēs izmantojam platumu, lai tās neizstieptu debesīs
  const isRoad = model.name.includes('road');
  const targetSize = isRoad ? 10 : 20; // 10m ielas, 20m ēkas
  
  // Ja iela, mērogojam pēc platuma (X/Z), ja ēka - pēc augstuma (Y)
  const referenceDim = isRoad ? Math.max(size.x, size.z) : size.y;
  const scale = referenceDim > 0 ? targetSize / referenceDim : 1;
  
  model.scale.setScalar(scale);

  // Pārrēķinām kasti pēc scale!
  model.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(model);
  box.getSize(size);
  box.getCenter(center);

  // 1. & 2. Centrē un noliek uz zemes (Mūsu drošais Children approach)
  // Mēs nebīdām model.position, mēs bīdām iekšas, saglabājot root uz 0,0,0
  const offset = new THREE.Vector3(center.x, box.min.y, center.z);
  
  model.children.forEach((child) => {
    child.position.sub(offset);
  });

  // EPS tīrīšana
  model.traverse((child: any) => {
    if (child !== model && child.position) {
      if (Math.abs(child.position.y) < 0.0001) child.position.y = 0;
      if (Math.abs(child.position.x) < 0.0001) child.position.x = 0;
      if (Math.abs(child.position.z) < 0.0001) child.position.z = 0;
    }
  });

  return model;
}
