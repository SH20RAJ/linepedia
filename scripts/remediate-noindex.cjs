const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '../src/content/blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const keepPatterns = [
  'famous-poets-you-should-know',
  'instagram-captions-for-poetry-lovers',
  'best-urdu-words-for-poetry-names',
  'urdu-shayari-poetic-devices-meaning',
  'how-to-write-shayari-beginners-guide',
  'what-is-shayari-meaning-types-examples',
  'best-sad-shayari-whatsapp-status',
  'famous-public-domain-poems-meanings',
  'top-deep-lines-lines-for-your-next-social-media-post',
  'top-sad-shayari-lines-for-your-next-social-media-post',
  'the-timeless-legacy-of-',
  'captions', 'bios', 'quotes', 'shayari', 'poetry', 'poem'
];

let modified = 0;

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const isPoetryRelevant = keepPatterns.some(pattern => file.includes(pattern));
  
  const isOffTopic = !isPoetryRelevant || file.includes('ai-prompts-for-') || file.includes('-slang-') || file.includes('terms-');
  
  if (isOffTopic && !content.includes('noindex: true')) {
    // Add noindex: true before the closing ---
    content = content.replace(/\n---\n/, '\nnoindex: true\n---\n');
    fs.writeFileSync(filePath, content);
    modified++;
    console.log(`Noindexed: ${file}`);
  }
}
console.log(`Modified ${modified} files.`);
