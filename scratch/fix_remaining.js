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

// 1. AuthProvider
replaceInFile('components/providers/auth-provider.tsx', [
  ['role: UserRole;', 'roleName: string;'],
  ['role: string;', 'roleName: string;'],
]);

// 2. Header
replaceInFile('components/layout/header.tsx', [
  ['role: UserRole;', 'roleName: string;'],
  ['role: string;', 'roleName: string;'],
]);

// 3. Sidebar
replaceInFile('components/layout/sidebar.tsx', [
  ['allowedRoles?: UserRole[];', 'allowedRoles?: string[];'],
  ['roles?: UserRole[];', 'roles?: string[];'],
  ['const userRole = user?.role as UserRole;', 'const userRole = user?.roleName;'],
  ['user?.roleName as string', 'user?.roleName'],
]);

// 4. Products route
replaceInFile('app/api/products/route.ts', [
  ['session.role', 'session.roleName'],
]);

replaceInFile('app/api/products/[id]/route.ts', [
  ['session.role', 'session.roleName'],
]);

// 5. Admin Users routes
replaceInFile('app/api/admin/users/route.ts', [
  ['permissions: true,', 'role: { select: { name: true } },'],
]);

replaceInFile('app/api/admin/users/[id]/route.ts', [
  ['permissions: true,', 'role: { select: { name: true } },'],
  ['user.role', 'user.role?.name'],
  ['user.role?.name ===', 'user.roleName ==='], // if already replaced?
]);

// 6. Users routes (app/api/users)
replaceInFile('app/api/users/route.ts', [
  ['role: ', 'roleId: '],
]);

replaceInFile('app/api/users/[id]/route.ts', [
  ['role?: ', 'roleId?: '],
  ['role: ', 'roleId: '],
  ['"Operador de Caixa" | "Técnico" | "SuperADMIN"', 'string'],
]);

// 7. layout.tsx
replaceInFile('app/(dashboard)/layout.tsx', [
  ['role: user.role', 'roleName: user.roleName'],
]);
