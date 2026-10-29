// scripts/generate-png-icons.js
// Pure Node.js PNG icon generator for PWA (no native compilation dependencies required)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunks
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function renderPwaIcon(width, height, isMaskable = false) {
  const rawData = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) / 2;
  const scale = isMaskable ? 0.72 : 0.88;
  const rOuter = baseRadius * scale;
  const rTaiji = rOuter * 0.72;
  const rEye = rTaiji * 0.18;
  const rPupil = rEye * 0.45;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background color: Deep Jade / Ink Black
      let r = 7, g = 18, b = 15, a = 255;

      // Radial gradient background
      const normDist = dist / baseRadius;
      if (normDist < 1.0) {
        const bgFactor = 1.0 - normDist;
        r = Math.min(255, Math.floor(7 + 24 * bgFactor));
        g = Math.min(255, Math.floor(18 + 50 * bgFactor));
        b = Math.min(255, Math.floor(15 + 44 * bgFactor));
      }

      // Outer golden aura ring
      const ringWidth = Math.max(2, baseRadius * 0.04);
      if (Math.abs(dist - rOuter) <= ringWidth) {
        const ringEdge = 1 - Math.abs(dist - rOuter) / ringWidth;
        r = Math.floor(r * (1 - ringEdge) + 212 * ringEdge);
        g = Math.floor(g * (1 - ringEdge) + 163 * ringEdge);
        b = Math.floor(b * (1 - ringEdge) + 71 * ringEdge);
      }

      // Inner decorative ring
      const innerRingDist = rOuter * 0.88;
      if (Math.abs(dist - innerRingDist) <= ringWidth * 0.5) {
        const irEdge = 1 - Math.abs(dist - innerRingDist) / (ringWidth * 0.5);
        r = Math.floor(r * (1 - irEdge) + 245 * irEdge);
        g = Math.floor(g * (1 - irEdge) + 212 * irEdge);
        b = Math.floor(b * (1 - irEdge) + 135 * irEdge);
      }

      // Taiji Yin-Yang Center Disk
      if (dist <= rTaiji) {
        // Base colors
        const goldR = 230, goldG = 182, goldB = 84;   // Gold (Yang)
        const darkR = 9,   darkG = 24,  darkB = 20;   // Deep Jade (Yin)

        let isYang = dx > 0;

        // Top half-circle (dx=0, dy=-rTaiji/2, radius=rTaiji/2)
        const dTop = Math.sqrt(dx * dx + (dy + rTaiji / 2) * (dy + rTaiji / 2));
        if (dTop <= rTaiji / 2) {
          isYang = true;
        }

        // Bottom half-circle (dx=0, dy=rTaiji/2, radius=rTaiji/2)
        const dBottom = Math.sqrt(dx * dx + (dy - rTaiji / 2) * (dy - rTaiji / 2));
        if (dBottom <= rTaiji / 2) {
          isYang = false;
        }

        let curR = isYang ? goldR : darkR;
        let curG = isYang ? goldG : darkG;
        let curB = isYang ? goldB : darkB;

        // Yin-Yang Eyes
        // Top eye (center: 0, -rTaiji/2)
        if (dTop <= rEye) {
          curR = darkR; curG = darkG; curB = darkB;
          if (dTop <= rPupil) {
            curR = 59; curG = 179; curB = 113; // Jade green center
          }
        }

        // Bottom eye (center: 0, rTaiji/2)
        if (dBottom <= rEye) {
          curR = goldR; curG = goldG; curB = goldB;
          if (dBottom <= rPupil) {
            curR = 255; curG = 242; curB = 179; // Pale gold light
          }
        }

        // Taiji Outer Rim Border
        if (dist >= rTaiji - Math.max(2, baseRadius * 0.025)) {
          curR = 212; curG = 163; curB = 71;
        }

        r = curR;
        g = curG;
        b = curB;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  // PNG Signature
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all standard PWA resolutions
const targets = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon.png', size: 32, maskable: false },
];

targets.forEach(t => {
  const buf = renderPwaIcon(t.size, t.size, t.maskable);
  // Write to root
  fs.writeFileSync(path.join(__dirname, '..', t.file), buf);
  // Also write to public/
  const pubDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, t.file), buf);
  console.log(`Generated: ${t.file} (${t.size}x${t.size}${t.maskable ? ' maskable' : ''})`);
});
