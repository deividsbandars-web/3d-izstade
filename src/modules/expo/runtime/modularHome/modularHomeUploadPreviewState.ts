import { useSyncExternalStore } from 'react';
import {
  HOME_UPLOAD_PREVIEW_ACCEPTED_FORMATS,
  HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES,
} from './homeUploadPreviewFlags';

export type ModularHomeUploadPreviewStatus = 'empty' | 'ready' | 'error';

export type ModularHomeUploadPreviewState = {
  error: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  objectUrl: string | null;
  status: ModularHomeUploadPreviewStatus;
  updatedAt: string | null;
};

const EMPTY_UPLOAD_PREVIEW_STATE: ModularHomeUploadPreviewState = {
  error: null,
  fileName: null,
  fileSize: null,
  fileType: null,
  objectUrl: null,
  status: 'empty',
  updatedAt: null,
};

let currentState: ModularHomeUploadPreviewState = EMPTY_UPLOAD_PREVIEW_STATE;
const listeners = new Set<() => void>();

function emitUploadPreviewChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeUploadPreview(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function revokeCurrentObjectUrl() {
  if (currentState.objectUrl && typeof URL !== 'undefined') {
    URL.revokeObjectURL(currentState.objectUrl);
  }
}

function setUploadPreviewState(nextState: ModularHomeUploadPreviewState) {
  currentState = nextState;
  emitUploadPreviewChange();
}

function getUploadPreviewSnapshot() {
  return currentState;
}

function getFileExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  const dotIndex = lowerName.lastIndexOf('.');
  return dotIndex >= 0 ? lowerName.slice(dotIndex) : '';
}

export function validateModularHomeUploadPreviewFile(file: File): string | null {
  const extension = getFileExtension(file.name);

  if (!HOME_UPLOAD_PREVIEW_ACCEPTED_FORMATS.includes(extension as typeof HOME_UPLOAD_PREVIEW_ACCEPTED_FORMATS[number])) {
    return 'Only .glb or self-contained .gltf files are accepted in local preview.';
  }

  if (file.size <= 0) {
    return 'Selected file is empty.';
  }

  if (file.size > HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES) {
    return `File is too large for local preview. Limit is ${Math.round(HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES / 1024 / 1024)} MB.`;
  }

  return null;
}

export function setModularHomeUploadPreviewFile(file: File): ModularHomeUploadPreviewState {
  const validationError = validateModularHomeUploadPreviewFile(file);
  revokeCurrentObjectUrl();

  if (validationError) {
    const nextState: ModularHomeUploadPreviewState = {
      ...EMPTY_UPLOAD_PREVIEW_STATE,
      error: validationError,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || null,
      status: 'error',
      updatedAt: new Date().toISOString(),
    };
    setUploadPreviewState(nextState);
    return nextState;
  }

  const objectUrl = URL.createObjectURL(file);
  const nextState: ModularHomeUploadPreviewState = {
    error: null,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || null,
    objectUrl,
    status: 'ready',
    updatedAt: new Date().toISOString(),
  };
  setUploadPreviewState(nextState);
  return nextState;
}

export function clearModularHomeUploadPreviewFile() {
  revokeCurrentObjectUrl();
  setUploadPreviewState(EMPTY_UPLOAD_PREVIEW_STATE);
}

export function useModularHomeUploadPreviewState() {
  return useSyncExternalStore(
    subscribeUploadPreview,
    getUploadPreviewSnapshot,
    getUploadPreviewSnapshot,
  );
}

export function formatHomeUploadPreviewBytes(bytes: number | null) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) {
    return 'n/a';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
