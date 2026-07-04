import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectWebGLSupport } from '../../../components/webglSupport';

const originalWindow = (globalThis as { window?: unknown }).window;

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      search: '?forceWebGLUnsupported=1',
    },
  },
});

assert.deepEqual(detectWebGLSupport(), {
  available: false,
  mode: null,
  reason: 'WebGL fallback was requested for this session.',
});

if (originalWindow === undefined) {
  delete (globalThis as { window?: unknown }).window;
} else {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
}

const canvasShellSource = readFileSync('src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx', 'utf8');

assert.match(canvasShellSource, /detectWebGLSupport/);
assert.match(canvasShellSource, /WebGLUnsupported/);
assert.equal(canvasShellSource.includes('function detectWebglAvailability'), false);
assert.equal(canvasShellSource.includes('WEBGL REQUIRED'), false);
assert.equal(canvasShellSource.includes('get.webgl.org'), false);
