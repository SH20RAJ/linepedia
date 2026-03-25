import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POEMS_FILE = path.join(__dirname, '../src/content/poems.json');
const POSTERS_DIR = path.join(__dirname, '../public/posters');

// Ensure posters directory exists
if (!fs.existsSync(POSTERS_DIR)) {
  fs.mkdirSync(POSTERS_DIR, { recursive: true });
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

async function generatePoster(poem) {
  const width = 1000;
  const height = 1500;
  const margin = 120;
  const maxLineWidth = width - (margin * 2);

  // Simple text wrapping for SVG
  const content = poem.content.replace(/\n/g, ' ');
  const words = content.split(' ');
  const lines = [];
  let currentLine = '';

  // Approximate character width (rough serif)
  const charWidth = 24; 
  const charsPerLine = Math.floor(maxLineWidth / charWidth);

  words.forEach(word => {
    if ((currentLine + word).length > charsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  lines.push(currentLine.trim());

  // Limit lines to avoid overflow
  const displayLines = lines.slice(0, 15);
  const textYStart = height / 2 - (displayLines.length * 35);

  const svgText = displayLines.map((line, i) => 
    `<text x="50%" y="${textYStart + (i * 75)}" text-anchor="middle" fill="white" font-family="serif" font-size="52px" font-style="italic" font-weight="500">${escapeXml(line)}</text>`
  ).join('');

  const svgImage = `
    <svg width="${width}" height="${height}" viewbox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black"/>
      
      <!-- Subtle Texture Grid -->
      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" stroke-opacity="0.05" stroke-width="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Decorative Border -->
      <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <rect x="90" y="90" width="${width - 180}" height="${height - 180}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      
      <!-- Text -->
      ${svgText}
      
      <!-- Footer -->
      <line x1="${width/2 - 60}" y1="${height - 280}" x2="${width/2 + 60}" y2="${height - 280}" stroke="white" stroke-opacity="0.3" stroke-width="2" />
      <text x="50%" y="${height - 240}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="serif" font-size="34px" font-weight="bold" letter-spacing="4px">— ${escapeXml(poem.writer.toUpperCase())} —</text>
      <text x="50%" y="${height - 120}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-family="sans-serif" font-size="20px" font-weight="900" letter-spacing="10px">LINESPEDIA.COM</text>
    </svg>
  `;

  const outputPath = path.join(POSTERS_DIR, `${poem.slug}.png`);
  
  try {
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(outputPath);
  } catch (err) {
    console.error(`Error generating poster for ${poem.slug}:`, err);
  }
}

async function main() {
  console.log('🚀 Starting static poster generation (ESM)...');
  const poems = JSON.parse(fs.readFileSync(POEMS_FILE, 'utf-8'));
  console.log(`Processing ${poems.length} poems...`);

  const batchSize = 30;
  for (let i = 0; i < poems.length; i += batchSize) {
    const batch = poems.slice(i, i + batchSize);
    await Promise.all(batch.map(poem => generatePoster(poem)));
    console.log(`Generated posters ${i + 1} to ${Math.min(i + batchSize, poems.length)}...`);
  }

  console.log('✅ All posters generated successfully in public/posters/');
}

main();
