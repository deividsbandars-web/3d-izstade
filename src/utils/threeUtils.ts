import * as THREE from 'three';

/**
 * Normalizes a 3D model: centers it on X and Z axes, aligns its bottom to Y=0,
 * and scales it to a consistent target size based on its largest dimension.
 * 
 * @param scene The THREE.Object3D or THREE.Group to normalize.
 * @param targetSize The desired maximum dimension (width, height, or depth) of the model. Defaults to 20.
 */
export const normalizeModel = (scene: THREE.Object3D, targetSize: number = 20) => {
  // 1. Force update matrix world to ensure accurate bounding box calculation
  scene.updateMatrixWorld(true);

  // 2. Compute the bounding box of the entire hierarchy
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  
  box.getSize(size);
  box.getCenter(center);

  // 3. Calculate and apply the normalization scale factor
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = (maxDim > 0) ? (targetSize / maxDim) : 1;
  
  // Set the local scale of the object
  scene.scale.setScalar(scaleFactor);

  // 4. Center horizontally (X, Z) and ground vertically (Y=0)
  // We move the object so that its internal origin aligns with the calculated offsets.
  // Note: We multiply original box values by scaleFactor because we scaled the object.
  scene.position.set(
    -center.x * scaleFactor,
    -box.min.y * scaleFactor,
    -center.z * scaleFactor
  );

  // 5. Debugging logs for precise asset calibration
  console.group(`[3D Normalization] Asset: ${scene.name || 'GLTF_Scene'}`);
  console.log(`Original Size: ${size.x.toFixed(2)}m, ${size.y.toFixed(2)}m, ${size.z.toFixed(2)}m`);
  console.log(`Scale Factor Applied: ${scaleFactor.toFixed(4)} (Target: ${targetSize}m)`);
  console.log(`Grounding Offset Applied: ${scene.position.y.toFixed(2)}m`);
  console.log(`New Local Position:`, {
    x: scene.position.x.toFixed(2),
    y: scene.position.y.toFixed(2),
    z: scene.position.z.toFixed(2)
  });
  console.groupEnd();

  return {
    scaleFactor,
    originalSize: size,
    newPosition: scene.position.clone()
  };
};

/**
 * Utility to calculate the scale required to fit a model within a specific target size.
 */
export const autoScale = (scene: THREE.Object3D, targetSize: number) => {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  return maxDim > 0 ? targetSize / maxDim : 1;
};
