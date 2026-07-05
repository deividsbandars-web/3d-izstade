function readSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams('');
  }

  return new URLSearchParams(window.location.search);
}

export function isExpo3dQaEnabled() {
  const params = readSearchParams();
  if (params.get('qa3d') === '1') {
    return true;
  }

  if (typeof window !== 'undefined' && window.sessionStorage?.getItem('warpala:qa3d') === '1') {
    return true;
  }

  return import.meta.env.VITE_ENABLE_3D_QA === '1';
}

export function isGalaConstructionAuditEnabled() {
  const params = readSearchParams();
  if (params.get('galaConstructionAudit') === '1') {
    return true;
  }

  return typeof window !== 'undefined'
    && window.sessionStorage?.getItem('warpala:galaConstructionAudit') === '1';
}
