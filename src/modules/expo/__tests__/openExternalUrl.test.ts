import assert from 'node:assert/strict';
import { normalizeExternalHttpUrl, openExternalUrl, type ExternalWindowOpen } from '../../../utils/openExternalUrl';

const calls: Array<{ features?: string; target?: string; url?: string | URL }> = [];
const openWindow: ExternalWindowOpen = (url, target, features) => {
  calls.push({ features, target, url });
  return null;
};

assert.equal(normalizeExternalHttpUrl('https://example.com/path'), 'https://example.com/path');
assert.equal(normalizeExternalHttpUrl('http://example.com/path'), 'http://example.com/path');
assert.equal(normalizeExternalHttpUrl('javascript:alert(1)'), null);
assert.equal(normalizeExternalHttpUrl('ftp://example.com/file'), null);
assert.equal(normalizeExternalHttpUrl('/relative/path'), null);
assert.equal(normalizeExternalHttpUrl(''), null);

assert.equal(openExternalUrl('https://example.com/video.mp4', openWindow), true);
assert.deepEqual(calls[0], {
  features: 'noopener,noreferrer',
  target: '_blank',
  url: 'https://example.com/video.mp4',
});

assert.equal(openExternalUrl('javascript:alert(1)', openWindow), false);
assert.equal(calls.length, 1);
