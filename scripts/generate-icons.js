import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Cinema SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="red" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#be123c" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#bg)" />

  <!-- Clapperboard Base -->
  <g transform="translate(64, 80)">
    <!-- Slate Body -->
    <rect x="24" y="140" width="336" height="210" rx="18" fill="#18181b" stroke="#27272a" stroke-width="4" />
    
    <!-- Clap Sticks (Rotated open top) -->
    <g transform="translate(24, 60) rotate(-14 24 60)">
      <rect x="0" y="0" width="336" height="54" rx="8" fill="#18181b" stroke="#27272a" stroke-width="3" />
      <!-- Stripes -->
      <polygon points="40,0 75,0 45,54 10,54" fill="url(#gold)" />
      <polygon points="110,0 145,0 115,54 80,54" fill="url(#gold)" />
      <polygon points="180,0 215,0 185,54 150,54" fill="url(#gold)" />
      <polygon points="250,0 285,0 255,54 220,54" fill="url(#gold)" />
    </g>

    <!-- Lower Stick -->
    <rect x="24" y="96" width="336" height="46" rx="6" fill="#18181b" stroke="#27272a" stroke-width="3" />
    <polygon points="64,96 99,96 69,142 34,142" fill="url(#gold)" />
    <polygon points="134,96 169,96 139,142 104,142" fill="url(#gold)" />
    <polygon points="204,96 239,96 209,142 174,142" fill="url(#gold)" />
    <polygon points="274,96 309,96 279,142 244,142" fill="url(#gold)" />

    <!-- Film Reel Center Graphic / Star -->
    <circle cx="192" cy="245" r="54" fill="#09090b" stroke="url(#gold)" stroke-width="4" filter="url(#glow)" />
    
    <!-- Film Reel holes -->
    <circle cx="192" cy="215" r="9" fill="url(#gold)" />
    <circle cx="217" cy="235" r="9" fill="url(#gold)" />
    <circle cx="210" cy="265" r="9" fill="url(#gold)" />
    <circle cx="174" cy="265" r="9" fill="url(#gold)" />
    <circle cx="167" cy="235" r="9" fill="url(#gold)" />
    <circle cx="192" cy="245" r="14" fill="#18181b" stroke="url(#gold)" stroke-width="2" />

    <!-- Play arrow in center -->
    <polygon points="188,238 200,245 188,252" fill="url(#gold)" />

    <!-- Text simulation lines -->
    <rect x="54" y="318" width="80" height="8" rx="4" fill="#52525b" />
    <rect x="150" y="318" width="60" height="8" rx="4" fill="#52525b" />
    <rect x="230" y="318" width="100" height="8" rx="4" fill="url(#gold)" />
  </g>

  <!-- Golden Rating Star Badge at bottom right -->
  <g transform="translate(350, 350)">
    <circle cx="36" cy="36" r="38" fill="url(#red)" filter="url(#glow)" />
    <path d="M36,12 L43,26 L58,28 L47,39 L50,54 L36,46 L22,54 L25,39 L14,28 L29,26 Z" fill="#ffffff" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Function to generate uncompressed standard PNG buffer
function createSolidPNG(width, height, r, g, b, a = 255) {
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + len);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None
    
    // Gradient or cinema icon pattern
    const ratioY = y / height;
    const curR = Math.round(15 * (1 - ratioY) + 2 * ratioY);
    const curG = Math.round(23 * (1 - ratioY) + 6 * ratioY);
    const curB = Math.round(42 * (1 - ratioY) + 23 * ratioY);

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw a gold clapperboard / star center area
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.32;

      if (dist < radius) {
        // Gold / warm center emblem
        rawData[pxOffset] = 234;     // R
        rawData[pxOffset + 1] = 179; // G
        rawData[pxOffset + 2] = 8;   // B
        rawData[pxOffset + 3] = 255;
      } else if (dist < radius + 6) {
        // Ring border
        rawData[pxOffset] = 253;
        rawData[pxOffset + 1] = 224;
        rawData[pxOffset + 2] = 71;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = curR;
        rawData[pxOffset + 1] = curG;
        rawData[pxOffset + 2] = curB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pwa192 = createSolidPNG(192, 192, 15, 23, 42);
const pwa512 = createSolidPNG(512, 512, 15, 23, 42);
const appleTouch = createSolidPNG(180, 180, 15, 23, 42);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pwa192);

console.log('Icons generated successfully in public/');
