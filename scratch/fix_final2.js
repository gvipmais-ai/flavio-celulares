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

replaceInFile('lib/audit.ts', [
  ["| 'RETURN_CREATED';", "| 'RETURN_CREATED'\n  | 'ROLE_CREATED'\n  | 'ROLE_UPDATED'\n  | 'ROLE_DELETED';"],
]);

replaceInFile('app/api/roles/route.ts', [
  ["permissions: z.record(z.any()),", "permissions: z.record(z.string(), z.any()),"],
]);

replaceInFile('app/api/roles/[id]/route.ts', [
  ["permissions: z.record(z.any()).optional(),", "permissions: z.record(z.string(), z.any()).optional(),"],
]);

replaceInFile('components/admin/roles/RoleEditor.tsx', [
  ["schema[moduleName] || {}", "schema?.[moduleName] || {}"],
]);

replaceInFile('components/admin/roles/RoleList.tsx', [
  ["<ShieldAlert className=\"h-4 w-4 text-amber-500\" title=\"Cargo de Sistema\" />", "<span title=\"Cargo de Sistema\"><ShieldAlert className=\"h-4 w-4 text-amber-500\" /></span>"],
]);
