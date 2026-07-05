#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 512;
const HEIGHT = 256;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, '../public/textures/gala/gala-studio-512.hdr');

function toRgbe(red, green, blue) {
  const maximum = Math.max(red, green, blue);
  if (maximum < 1e-32) {
    return [0, 0, 0, 0];
  }

  const exponent = Math.floor(Math.log2(maximum)) + 1;
  const scale = 256 / (2 ** exponent);
  return [
    Math.min(255, Math.round(red * scale)),
    Math.min(255, Math.round(green * scale)),
    Math.min(255, Math.round(blue * scale)),
    exponent + 128,
  ];
}

function wrappedDistance(left, right) {
  const direct = Math.abs(left - right);
  return Math.min(direct, 1 - direct);
}

function gaussian(value, center, spread) {
  const distance = (value - center) / spread;
  return Math.exp(-(distance * distance));
}

function sampleEnvironment(u, v) {
  const horizon = Math.exp(-(((v - 0.52) / 0.1) ** 2));
  const skyAmount = Math.max(0, (0.54 - v) / 0.54);
  const groundAmount = Math.max(0, (v - 0.5) / 0.5);
  const leftPanel = gaussian(wrappedDistance(u, 0.18), 0, 0.055) * gaussian(v, 0.31, 0.17);
  const rightPanel = gaussian(wrappedDistance(u, 0.72), 0, 0.075) * gaussian(v, 0.38, 0.2);
  const warmKey = gaussian(wrappedDistance(u, 0.43), 0, 0.025) * gaussian(v, 0.22, 0.055);

  return [
    0.09 + (skyAmount * 0.3) + (groundAmount * 0.025) + (horizon * 0.22) + (leftPanel * 2.8) + (rightPanel * 1.8) + (warmKey * 7.5),
    0.11 + (skyAmount * 0.37) + (groundAmount * 0.022) + (horizon * 0.2) + (leftPanel * 2.55) + (rightPanel * 1.72) + (warmKey * 5.6),
    0.15 + (skyAmount * 0.48) + (groundAmount * 0.02) + (horizon * 0.18) + (leftPanel * 2.2) + (rightPanel * 1.65) + (warmKey * 3.4),
  ];
}

function encodeLiteralChannel(channel) {
  const chunks = [];
  for (let offset = 0; offset < channel.length; offset += 128) {
    const length = Math.min(128, channel.length - offset);
    chunks.push(Buffer.from([length]), Buffer.from(channel.subarray(offset, offset + length)));
  }
  return chunks;
}

const parts = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${HEIGHT} +X ${WIDTH}\n`, 'ascii')];
for (let y = 0; y < HEIGHT; y += 1) {
  const channels = Array.from({ length: 4 }, () => new Uint8Array(WIDTH));
  for (let x = 0; x < WIDTH; x += 1) {
    const rgb = sampleEnvironment((x + 0.5) / WIDTH, (y + 0.5) / HEIGHT);
    const rgbe = toRgbe(rgb[0], rgb[1], rgb[2]);
    channels.forEach((channel, channelIndex) => {
      channel[x] = rgbe[channelIndex];
    });
  }
  parts.push(Buffer.from([2, 2, WIDTH >> 8, WIDTH & 255]));
  channels.forEach((channel) => parts.push(...encodeLiteralChannel(channel)));
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.concat(parts));
console.log(`Generated ${outputPath} (${WIDTH}x${HEIGHT})`);
