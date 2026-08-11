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

replaceInFile('lib/validations.ts', [
  ["role: z.enum(['SuperADMIN', 'Técnico', 'Operador de Caixa']),", "roleId: z.string(),"],
  ["role: z.enum(['SuperADMIN', 'Técnico', 'Operador de Caixa']).optional(),", "roleId: z.string().optional(),"],
]);

replaceInFile('app/api/users/[id]/route.ts', [
  ['const { name, email, password, role, isActive } =', 'const { name, email, password, roleId, isActive } ='],
  ['role: body.role,', 'roleId: body.roleId,'],
]);

replaceInFile('app/api/users/route.ts', [
  ['const { name, email, password, role } =', 'const { name, email, password, roleId } ='],
  ['role,', 'roleId,'],
  ['role: updated.role,', 'roleName: updated.role?.name || "Sem Cargo",'],
  ['user.role,', 'user.roleId,'],
  ['...user,', '...user, roleName: user.role?.name || "Sem Cargo",'],
]);

replaceInFile('components/layout/sidebar.tsx', [
  ['user.role ===', 'user.roleName ==='],
  ['user.role ', 'user.roleName '],
  ['user.role)', 'user.roleName)'],
  ['user?.role ', 'user?.roleName '],
  ['user.role.', 'user.roleName.'],
  ['user.role,', 'user.roleName,'],
  ['user.role]', 'user.roleName]'],
  ['user.role!', 'user.roleName!'],
  ['user.role}', 'user.roleName}'],
]);
