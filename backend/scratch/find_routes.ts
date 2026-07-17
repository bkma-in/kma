import * as fs from 'fs';
import * as path from 'path';

function findRoutes() {
  const filePath = path.join(__dirname, '../src/routes/articleRoutes.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  console.log('--- ROUTE DECLARATIONS IN articleRoutes.ts ---');
  lines.forEach((line, idx) => {
    if (line.includes('router.') || line.includes('app.')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

findRoutes();
