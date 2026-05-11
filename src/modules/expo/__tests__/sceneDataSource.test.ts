import assert from 'node:assert/strict';
import { shouldUseReviewExpoSceneSource } from '../runtime/data/sceneDataMode.js';

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'localhost',
  isDev: true,
  search: '',
}), true);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'localhost',
  isDev: true,
  search: '?expoData=live',
}), false);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'staging.30sek24.com',
  isDev: false,
  search: '?operator=1&expoData=review',
}), true);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'staging.30sek24.com',
  isDev: false,
  search: '?operator=1&expoData=seeded',
}), true);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'staging.30sek24.com',
  isDev: false,
  search: '?operator=1&expoData=live',
}), false);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'www.30sek24.com',
  isDev: false,
  search: '?operator=1&expoData=review',
}), false);

assert.equal(shouldUseReviewExpoSceneSource({
  hostname: 'staging.30sek24.com',
  isDev: false,
  search: '?expoData=review',
}), false);
