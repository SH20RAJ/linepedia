import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const INPUT_ICON = path.join(ROOT, 'public', 'favicon.svg');
const OUTPUT_DIR = path.join(ROOT, 'public', 'icons');

const ICON_SIZES = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
];

async function generateIcons() {
  if (!fs.existsSync(INPUT_ICON)) {
    throw new Error(`Input icon not found: ${INPUT_ICON}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    ICON_SIZES.map(async ({ name, size }) => {
      const outputPath = path.join(OUTPUT_DIR, name);
      await sharp(INPUT_ICON)
        .resize(size, size)
        .png({ quality: 100 })
        .toFile(outputPath);
      console.log(`Generated ${path.relative(ROOT, outputPath)}`);
    }),
  );

  console.log('PWA icon generation complete.');
}

generateIcons().catch((error) => {
  console.error('Failed to generate PWA icons:', error);
  process.exitCode = 1;
});
