const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('https://library.linespedia.com')) {
    content = content.replace(/https:\/\/linespedia\.com/g, 'https://library.linespedia.com');
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.astro' || file === '.wrangler') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (stat.isFile()) {
      if (
        filePath.endsWith('.js') || filePath.endsWith('.ts') || 
        filePath.endsWith('.astro') || filePath.endsWith('.md') ||
        filePath.endsWith('.json') || filePath.endsWith('.mjs') ||
        filePath.endsWith('.cjs') || filePath.endsWith('.xml') ||
        filePath.endsWith('.txt') || filePath.endsWith('.gs')
      ) {
        replaceInFile(filePath);
      }
    }
  }
}

walkDir(path.join(__dirname, '..'));
console.log('Done!');
