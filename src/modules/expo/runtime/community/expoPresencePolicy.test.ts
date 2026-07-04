import assert from 'node:assert/strict';
import {
  getExpoVisibleGuestLimit,
  normalizeExpoPresenceGuests,
} from './expoPresencePolicy.js';
import { isExpoTextEntryTarget } from '../world/scene/ExpoWorldPlayerFrameSupport.js';

const guests = normalizeExpoPresenceGuests([
  { color: '#FF00AA', id: 'guest-1', isSpeaking: true, position: [10, 2, -30] },
  { color: 'bad', id: 'guest-1', position: [20, 2, -40] },
  { color: 'bad', id: 'guest-2', position: [9999, 'x', -9999] },
  { id: '', position: [0, 0, 0] },
]);

assert.equal(guests.length, 2);
assert.equal(guests[0].color, '#ff00aa');
assert.deepEqual(guests[1].position, [1600, 0, -1600]);
assert.equal(getExpoVisibleGuestLimit('low'), 6);
assert.equal(getExpoVisibleGuestLimit('high'), 20);
assert.equal(isExpoTextEntryTarget({ tagName: 'TEXTAREA' }), true);
assert.equal(isExpoTextEntryTarget({ isContentEditable: true, tagName: 'DIV' }), true);
assert.equal(isExpoTextEntryTarget({ tagName: 'CANVAS' }), false);

console.log('expo presence policy tests passed');
