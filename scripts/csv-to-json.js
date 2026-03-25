import fs from 'fs';
import path from 'path';

/**
 * Simple CSV to JSON converter for poems.json
 * Usage: node scripts/csv-to-json.js input.csv
 */

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Please provide an input CSV file.");
  process.exit(1);
}

const csvData = fs.readFileSync(inputFile, 'utf-8');
const lines = csvData.split('\n');
const headers = lines[0].split(',').map(h => h.trim());

const jsonResult = lines.slice(1).filter(line => line.trim()).map(line => {
  const values = line.split(',').map(v => v.trim());
  const entry = {};
  headers.forEach((header, index) => {
    let value = values[index];
    if (header === 'category' || header === 'mood') {
      value = value ? value.split('|').map(v => v.trim()) : [];
    }
    entry[header] = value;
  });
  return entry;
});

const outputPath = path.join(process.cwd(), 'src/content/poems.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonResult, null, 2));

console.log(`Successfully converted ${jsonResult.length} entries to ${outputPath}`);
