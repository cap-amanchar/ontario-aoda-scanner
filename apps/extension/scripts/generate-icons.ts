#!/usr/bin/env bun

import { writeFileSync } from 'fs';
import { join } from 'path';

// Create a simple colored square PNG for each size
// This creates a valid PNG with accessibility blue color (#0066CC)
function createPNG(size: number): Buffer {
  const width = size;
  const height = size;

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // color type (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Create image data (blue square with white 'A' for accessibility)
  const scanlineSize = width * 3 + 1; // 3 bytes per pixel (RGB) + 1 filter byte
  const imageData = Buffer.alloc(height * scanlineSize);

  for (let y = 0; y < height; y++) {
    imageData.writeUInt8(0, y * scanlineSize); // filter byte (none)

    for (let x = 0; x < width; x++) {
      const offset = y * scanlineSize + 1 + x * 3;

      // Simple 'A' shape in white on blue background
      const isA = isPartOfA(x, y, size);

      if (isA) {
        imageData.writeUInt8(255, offset);     // R
        imageData.writeUInt8(255, offset + 1); // G
        imageData.writeUInt8(255, offset + 2); // B
      } else {
        imageData.writeUInt8(0, offset);       // R
        imageData.writeUInt8(102, offset + 1); // G
        imageData.writeUInt8(204, offset + 2); // B (#0066CC)
      }
    }
  }

  // Compress image data (using zlib deflate)
  const zlib = require('zlib');
  const compressedData = zlib.deflateSync(imageData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function isPartOfA(x: number, y: number, size: number): boolean {
  // Normalize coordinates to 0-1 range
  const nx = x / size;
  const ny = y / size;

  // Define A shape boundaries (simplified)
  const margin = 0.2;
  const thickness = 0.15;

  // Left leg of A
  const leftLeg = nx > margin && nx < margin + thickness && ny > margin && ny < 1 - margin;

  // Right leg of A
  const rightLeg = nx > 1 - margin - thickness && nx < 1 - margin && ny > margin && ny < 1 - margin;

  // Top horizontal bar
  const topBar = ny > margin && ny < margin + thickness && nx > margin && nx < 1 - margin;

  // Middle horizontal bar
  const midBar = ny > 0.5 && ny < 0.5 + thickness && nx > margin + thickness && nx < 1 - margin - thickness;

  return leftLeg || rightLeg || topBar || midBar;
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = calculateCRC(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(data: Buffer): number {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }

  return crc ^ 0xFFFFFFFF;
}

// Generate icons
const distPath = join(import.meta.dir, '..', 'dist', 'icons');
const sizes = [16, 32, 48, 128];

console.log('Generating icons...');

for (const size of sizes) {
  const png = createPNG(size);
  const filename = join(distPath, `icon-${size}.png`);
  writeFileSync(filename, png);
  console.log(`✓ Created ${filename} (${size}x${size})`);
}

console.log('Done!');
