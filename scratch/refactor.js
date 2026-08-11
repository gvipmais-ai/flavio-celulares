const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(apiDir);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('requirePermission(') && !content.includes('await requirePermission(')) {
    content = content.replace(/requirePermission\(/g, 'await requirePermission(');
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
