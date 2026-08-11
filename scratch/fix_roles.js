const fs = require('fs');
const path = require('path');

const srcDirs = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
  path.join(__dirname, '../lib'),
  path.join(__dirname, '../middleware.ts'),
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const stat = fs.statSync(dir);
  if (stat.isFile()) return [dir];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

let files = [];
for (const dir of srcDirs) {
  files = files.concat(walk(dir));
}

let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace session.role with session.roleName
  content = content.replace(/session\.role\b(?!\s*Id)/g, 'session.roleName');
  // Replace session?.role with session?.roleName
  content = content.replace(/session\?\.role\b/g, 'session?.roleName');
  // Replace user.role with user.roleName where it's used in auth logic (best effort, but user obj from DB has roleId and role object now, but some places might still be expecting string)
  
  // Replace string constants
  content = content.replace(/'SUPERADMIN'/g, "'SuperADMIN'");
  content = content.replace(/"SUPERADMIN"/g, '"SuperADMIN"');
  content = content.replace(/'OPERADOR_CAIXA'/g, "'Operador de Caixa'");
  content = content.replace(/"OPERADOR_CAIXA"/g, '"Operador de Caixa"');
  content = content.replace(/'TECNICO'/g, "'Técnico'");
  content = content.replace(/"TECNICO"/g, '"Técnico"');
  content = content.replace(/'ADMIN'/g, "'Gerente'");
  content = content.replace(/"ADMIN"/g, '"Gerente"');

  // Remove UserRole import
  content = content.replace(/, UserRole/g, '');
  content = content.replace(/UserRole,/g, '');
  content = content.replace(/import \{ UserRole \} from '@\/lib\/permissions';\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
