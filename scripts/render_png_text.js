#!/usr/bin/env node
const fs = require('fs');
const zlib = require('zlib');

const glyphs = {
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'C': ['01110','10001','10000','10000','10000','10001','01110'],
  'D': ['11100','10010','10001','10001','10001','10010','11100'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'G': ['01110','10001','10000','10111','10001','10001','01110'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'I': ['11111','00100','00100','00100','00100','00100','11111'],
  'J': ['00111','00010','00010','00010','10010','10010','01100'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10101','10001','10001','10001'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','10001','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','10101','01010'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','00110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['00110','01000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00010','01100'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000']
};

if (process.argv.length < 4) {
  console.error('Usage: node render_png_text.js <output> <line1> <line2> ...');
  process.exit(1);
}

const outputPath = process.argv[2];
const lines = process.argv.slice(3).map(line => line.toUpperCase());
const glyphWidth = 5;
const glyphHeight = 7;
const letterSpacing = 1;
const lineSpacing = 2;
const margin = 4;
const widthChars = Math.max(...lines.map(line => line.length));
const width = margin * 2 + Math.max(1, widthChars * (glyphWidth + letterSpacing) - letterSpacing);
const height = margin * 2 + lines.length * glyphHeight + (lines.length - 1) * lineSpacing;
const pixels = new Uint8Array(width * height * 4);

for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = 15; // background dark gray
  pixels[i + 1] = 20;
  pixels[i + 2] = 26;
  pixels[i + 3] = 255;
}

const drawPixel = (x, y, value) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  const intensity = value ? 255 : 15;
  pixels[idx] = intensity;
  pixels[idx + 1] = intensity;
  pixels[idx + 2] = intensity;
  pixels[idx + 3] = 255;
};

lines.forEach((line, lineIndex) => {
  const yOffset = margin + lineIndex * (glyphHeight + lineSpacing);
  [...line].forEach((ch, charIndex) => {
    const glyph = glyphs[ch] || glyphs[' '];
    const xOffset = margin + charIndex * (glyphWidth + letterSpacing);
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, bitIndex) => {
        drawPixel(xOffset + bitIndex, yOffset + rowIndex, bit === '1');
      });
    });
  });
});

const stride = width * 4;
const raw = Buffer.alloc((stride + 1) * height);
for (let y = 0; y < height; y++) {
  raw[y * (stride + 1)] = 0; // filter type 0
  const row = pixels.subarray(y * stride, (y + 1) * stride);
  raw.set(row, y * (stride + 1) + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const chunks = [];
const writeChunk = (type, data) => {
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc >>> 0, 8 + data.length);
  chunks.push(chunk);
};

const crc32 = (buf) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

writeChunk('IHDR', ihdr);
writeChunk('IDAT', zlib.deflateSync(raw));
writeChunk('IEND', Buffer.alloc(0));
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = Buffer.concat([signature, ...chunks]);
fs.writeFileSync(outputPath, png);
