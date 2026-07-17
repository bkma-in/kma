const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/articleRoutes.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('--- Matches in articleRoutes.ts ---');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('category')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
