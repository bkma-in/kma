const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('category') && !fullPath.includes('node_modules')) {
        console.log(`Found "category" in: ${fullPath}`);
      }
    }
  });
}

const backendSrc = path.join(__dirname, '../src');
console.log('Searching backend src...');
searchDir(backendSrc);
