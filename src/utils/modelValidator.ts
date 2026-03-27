import * as THREE from 'three';
import { isFiniteVector3, normalizeModel, type NormalizeModelOptions } from './threeUtils';

interface ValidationOptions {
  autoFix?: boolean;
  targetSize?: number;
  allowExtremeScale?: boolean;
  normalize?: NormalizeModelOptions;
}

export interface ModelValidationReport {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  fatalErrors: string[];
  residualIssues: string[];
  performance: {
    vertices: number;
    textures: number;
    meshes: number;
    materials: number;
  };
  geometry: {
    size: THREE.Vector3;
    center: THREE.Vector3;
    min: THREE.Vector3;
    max: THREE.Vector3;
    footprint: {
      width: number;
      depth: number;
    };
    grounded: boolean;
    centered: boolean;
    hasFiniteBounds: boolean;
    zeroSized: boolean;
  };
}

function shouldLogModelValidation() {
  const runtime = globalThis as typeof globalThis & {
    __CITY_VALIDATION_DEBUG__?: boolean;
    process?: { env?: { NODE_ENV?: string } };
  };

  const nodeEnv = runtime.process?.env?.NODE_ENV;
  return runtime.__CITY_VALIDATION_DEBUG__ === true || nodeEnv === 'test';
}

export const validateModel = (scene: THREE.Object3D, options: ValidationOptions = {}) => {
  const {
    autoFix = false,
    targetSize = 20,
    allowExtremeScale = false,
    normalize: normalizeOptions = {},
  } = options;

  const getBoxData = (obj: THREE.Object3D) => {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { box, size, center, position: obj.position.clone() };
  };

  const inspectScene = (): ModelValidationReport => {
    const boxData = getBoxData(scene);
    let vertexCount = 0;
    let meshCount = 0;
    let materialCount = 0;
    let hasUnbakedRotation = false;
    const textures = new Set<THREE.Texture>();

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshCount += 1;
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;
        if (geometry.attributes.position) {
          vertexCount += geometry.attributes.position.count;
        }

        const material = mesh.material as any;
        if (material) {
          const matArray = Array.isArray(material) ? material : [material];
          materialCount += matArray.length;
          matArray.forEach((entry) => {
            Object.keys(entry).forEach((key) => {
              if (entry[key] && (entry[key] as THREE.Texture).isTexture) {
                textures.add(entry[key]);
              }
            });
          });
        }
      }

      if (child.rotation.x !== 0 || child.rotation.y !== 0 || child.rotation.z !== 0) {
        hasUnbakedRotation = true;
      }
    });

    const report: ModelValidationReport = {
      isValid: true,
      warnings: [],
      errors: [],
      fatalErrors: [],
      residualIssues: [],
      performance: {
        vertices: vertexCount,
        textures: textures.size,
        meshes: meshCount,
        materials: materialCount,
      },
      geometry: {
        size: boxData.size.clone(),
        center: boxData.center.clone(),
        min: boxData.box.min.clone(),
        max: boxData.box.max.clone(),
        footprint: {
          width: boxData.size.x,
          depth: boxData.size.z,
        },
        grounded: Math.abs(boxData.box.min.y) <= 0.05,
        centered: Math.abs(boxData.center.x) <= 0.1 && Math.abs(boxData.center.z) <= 0.1,
        hasFiniteBounds: isFiniteVector3(boxData.size) && isFiniteVector3(boxData.center),
        zeroSized: boxData.size.x <= 0.001 || boxData.size.y <= 0.001 || boxData.size.z <= 0.001,
      },
    };

    const markFatal = (issue: string) => {
      report.errors.push(issue);
      report.fatalErrors.push(issue);
      report.isValid = false;
    };

    const markResidual = (issue: string) => {
      report.errors.push(issue);
      report.residualIssues.push(issue);
      report.isValid = false;
    };

    if (vertexCount > 300000) {
      report.warnings.push('PERF_HIGH_POLY');
    }

    if (textures.size > 10) {
      report.warnings.push('PERF_HIGH_TEXTURE_COUNT');
    }

    if (materialCount > 24) {
      report.warnings.push('PERF_HIGH_MATERIAL_COUNT');
    }

    if (meshCount > 64) {
      report.warnings.push('PERF_HIGH_MESH_COUNT');
    }

    if (meshCount === 0) {
      markFatal('GEO_NO_MESHES');
    }

    if (!report.geometry.hasFiniteBounds) {
      markFatal('GEO_INVALID_BOUNDS');
    }

    if (report.geometry.zeroSized) {
      markFatal('GEO_ZERO_SIZE');
    }

    if (!report.geometry.centered) {
      markResidual('GEO_NOT_CENTERED');
    }

    if (!report.geometry.grounded) {
      markResidual('GEO_NOT_GROUNDED');
    }

    if (hasUnbakedRotation) {
      report.warnings.push('GEO_UNBAKED_ROTATION');
    }

    const maxDim = Math.max(boxData.size.x, boxData.size.y, boxData.size.z);
    if (maxDim > 500 || maxDim < 0.1) {
      if (allowExtremeScale) {
        report.warnings.push('GEO_EXTREME_SCALE');
      } else {
        markFatal('GEO_EXTREME_SCALE');
      }
    }

    return report;
  };

  let results = inspectScene();

  const logValidationReport = (phase = 'initial') => {
    if (!shouldLogModelValidation()) {
      return;
    }

    console.group(`[Smart Validator][${phase}] ${scene.name || 'Unnamed Asset'}`);
    if (results.warnings.length > 0) {
      results.warnings.forEach((warning) => console.warn(warning));
    }
    if (results.errors.length > 0) {
      results.errors.forEach((error) => console.error(error));
    }
    console.groupEnd();
  };

  logValidationReport();

  if (autoFix && !results.isValid) {
    normalizeModel(scene, { targetSize, ...normalizeOptions });
    results = inspectScene();
    logValidationReport('post-fix');
  }

  return results;
};
