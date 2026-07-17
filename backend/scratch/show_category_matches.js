const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/EditorialBoardModal.tsx',
  'frontend/src/pages/admin/AdminArticles.tsx',
  'frontend/src/pages/admin/AdminReadyToPublish.tsx',
  'frontend/src/pages/author/AuthorRevisionRequired.tsx',
  'frontend/src/pages/author/Drafts.tsx',
  'frontend/src/pages/author/MyArticles.tsx'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, '../..', f);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== MATCHES IN ${f} ===`);
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('category')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
