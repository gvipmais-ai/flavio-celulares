const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let newContent = content;
  for (const [search, replace] of replacements) {
    if (search instanceof RegExp) {
      newContent = newContent.replace(search, replace);
    } else {
      newContent = newContent.split(search).join(replace);
    }
  }
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

replaceInFile('app/api/products/[id]/route.ts', [
  [/session!\.role/g, 'session!.roleName'],
]);

replaceInFile('app/api/products/route.ts', [
  [/session!\.role/g, 'session!.roleName'],
]);

replaceInFile('app/api/users/[id]/route.ts', [
  ['role?: "SuperADMIN" | "Técnico" | "Operador de Caixa"', 'roleId?: string'],
  ['role?: string', 'roleId?: string'],
  ['role?: "SuperADMIN" | "Técnico" | "Operador de Caixa" | undefined', 'roleId?: string | undefined'],
]);

replaceInFile('app/api/users/route.ts', [
  ['user.role,', 'user.roleId,'],
]);

replaceInFile('components/layout/sidebar.tsx', [
  ['// import { UserRole } from', ''],
  ['UserRole,', ''],
  ['UserRole', 'string'],
  ['user.role ', 'user.roleName '],
  ['user.role.', 'user.roleName.'],
]);

replaceInFile('tests/integration/permissions.test.ts', [
  ['hasPermissionAsync', 'requirePermission'],
]);
