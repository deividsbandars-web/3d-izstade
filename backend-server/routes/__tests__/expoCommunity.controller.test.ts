import assert from 'node:assert/strict';
import type { Response } from 'express';
import {
  createExpoCommunityGraffiti,
  createExpoCommunityVoice,
  getExpoCommunityAudio,
  listExpoCommunity,
  listExpoCommunityModeration,
  moderateExpoCommunity,
  reportExpoCommunityItem,
  resetExpoCommunityForTests,
} from '../../controllers/expoCommunityController.js';
import { resetRedisRateLimitForTests } from '../../services/redisRateLimit.js';
import type { AuthRequest } from '../../middleware/authMiddleware.js';

function createResponseCapture() {
  const state: { body?: any; headers: Record<string, string>; statusCode: number; type?: string } = { headers: {}, statusCode: 200 };
  const response = {
    json(body: unknown) { state.body = body; return response; },
    send(body: unknown) { state.body = body; return response; },
    set(name: string, value: string) { state.headers[name.toLowerCase()] = value; return response; },
    status(code: number) { state.statusCode = code; return response; },
    type(value: string) { state.type = value; return response; },
  } as unknown as Response;
  return { response, state };
}

resetExpoCommunityForTests();
resetRedisRateLimitForTests();

let firstGraffitiId = '';
for (let index = 0; index < 4; index += 1) {
  const { response, state } = createResponseCapture();
  await createExpoCommunityGraffiti({
    body: {
      color: '#22d3ee',
      markText: `MARK${index}`,
      placement: {
        hostId: 'city-panel-1',
        normalX: 0,
        normalY: 0,
        normalZ: 1,
        rotationY: 0.4,
        surfaceLabel: 'Current city spot',
        x: -12.5,
        y: 3.2,
        z: -44.25,
      },
    },
    user: { email: 'visitor@example.com', id: 'visitor-1', role: 'user' },
  } as AuthRequest, response);

  if (index < 3) {
    assert.equal(state.statusCode, 201);
    assert.equal(state.body.graffiti.status, 'approved');
    assert.deepEqual(state.body.graffiti.placement, { hostId: 'city-panel-1', normalX: 0, normalY: 0, normalZ: 1, rotationY: 0.4, surfaceLabel: 'Current city spot', x: -12.5, y: 3.2, z: -44.25 });
    firstGraffitiId ||= state.body.graffiti.id;
  } else {
    assert.equal(state.statusCode, 429);
    assert.match(state.body.error, /graffiti up to 3 times per hour/i);
  }
}

const afterCreate = createResponseCapture();
await listExpoCommunity({} as AuthRequest, afterCreate.response);
assert.equal(afterCreate.state.body.graffiti.length, 3);
assert.equal(afterCreate.state.body.persistence, 'process-memory');

const visibleGraffiti = createResponseCapture();
await listExpoCommunity({} as AuthRequest, visibleGraffiti.response);
assert.equal(visibleGraffiti.state.body.graffiti.length, 3);
assert.equal(visibleGraffiti.state.body.graffiti[0].markText, 'MARK0');
assert.equal(visibleGraffiti.state.body.graffiti[0].placement.surfaceLabel, 'Current city spot');
assert.equal(visibleGraffiti.state.body.graffiti[0].placement.hostId, 'city-panel-1');
assert.ok(visibleGraffiti.state.body.graffiti[0].expiresAt);

for (let index = 0; index < 3; index += 1) {
  const report = createResponseCapture();
  await reportExpoCommunityItem({
    body: { detail: 'Needs review', reason: 'other' },
    params: { id: firstGraffitiId },
    user: { id: `reporter-${index}`, role: 'user' },
  } as unknown as AuthRequest, report.response);
  assert.equal(report.state.statusCode, 202);
  assert.equal(report.state.body.item.reportCount, index + 1);
}

const afterReports = createResponseCapture();
await listExpoCommunity({} as AuthRequest, afterReports.response);
assert.equal(afterReports.state.body.graffiti.length, 2);

const moderationAfterReports = createResponseCapture();
await listExpoCommunityModeration({} as AuthRequest, moderationAfterReports.response);
const reportedGraffiti = moderationAfterReports.state.body.graffiti.find((item: any) => item.id === firstGraffitiId);
assert.equal(reportedGraffiti.status, 'pending');
assert.equal(reportedGraffiti.reportCount, 3);
assert.ok(moderationAfterReports.state.body.audit.some((event: any) => event.action === 'reported'));

const removed = createResponseCapture();
await moderateExpoCommunity({
  body: { note: 'Reported during QA', status: 'removed' },
  params: { id: firstGraffitiId },
  user: { id: 'admin-1', role: 'admin' },
} as unknown as AuthRequest, removed.response);
assert.equal(removed.state.body.item.status, 'removed');
assert.equal(removed.state.body.item.removalReason, 'Reported during QA');

const voiceUpload = createResponseCapture();
await createExpoCommunityVoice({
  body: Buffer.from('short-audio'),
  headers: { 'content-type': 'audio/webm', 'x-community-title': 'Walking note' },
  user: { id: 'voice-visitor', role: 'user' },
} as unknown as AuthRequest, voiceUpload.response);
assert.equal(voiceUpload.state.statusCode, 201);
assert.equal(voiceUpload.state.body.entry.status, 'pending');

const voicePreview = createResponseCapture();
await getExpoCommunityAudio({ params: { id: voiceUpload.state.body.entry.id } } as unknown as AuthRequest, voicePreview.response);
assert.equal(voicePreview.state.statusCode, 200);
assert.equal(voicePreview.state.headers['cache-control'], 'private, no-store');
assert.equal(Buffer.isBuffer(voicePreview.state.body), true);

console.log('expo community controller tests passed');
