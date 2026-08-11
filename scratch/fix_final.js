const fs = require('fs');

function replaceInFile(path, regexes, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (let i = 0; i < regexes.length; i++) {
    if (regexes[i].test(content)) {
      content = content.replace(regexes[i], replacements[i]);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(path, content);
    console.log('Fixed', path);
  }
}

// admin users APIs
replaceInFile('app/api/admin/users/route.ts',
  [/,\s*role:\s*true/g, /roleId:\s*true/g, /role:\s*u.role/g, /roleId:\s*u.roleId/g],
  ['', 'cargo: true', 'cargo: u.cargo', 'cargo: u.cargo']
);

replaceInFile('app/api/admin/users/[id]/route.ts',
  [/roleId/g, /u.role/g],
  ['cargo', 'u.cargo']
);

// auth login/me (cleanup)
replaceInFile('app/api/auth/login/route.ts',
  [/,\s*role:\s*\{\s*select:\s*\{\s*name:\s*true\s*\}\s*\}/g, /roleId:\s*user.roleId\s*\|\|\s*'',/g, /roleName:\s*user.role\?.name\s*\|\|\s*'',/g, /roleId\s*:\s*user\.roleId\s*\|\|\s*'',\s*roleName\s*:\s*user\.role\?.name\s*\|\|\s*'',/g, /role:\s*\{\s*id:\s*user\.roleId,\s*name:\s*user\.role\?.name\s*\}/g, /roleId:\s*'master',/g],
  ['', 'cargo: user.cargo,', 'cargo: user.cargo,', 'cargo: user.cargo,', 'cargo: user.cargo', 'cargo: "SUPERADMIN",']
);

// backup
replaceInFile('app/api/backup/export/route.ts',
  [/,\s*role:\s*\{\s*select:\s*\{\s*name:\s*true\s*\}\s*\}/g],
  ['']
);

// master resets
replaceInFile('app/api/master/database/reset/route.ts',
  [/await prisma\.role\.deleteMany\(\);/g, /await prisma\.role\.createMany\(\{[\s\S]*?\}\);/g, /roleId:\s*superAdminRole\.id,/g, /mustChangePassword:\s*true,/g],
  ['', '', 'cargo: "SUPERADMIN",', '']
);

replaceInFile('app/api/master/database/backup/route.ts',
  [/const roles\s*=\s*await prisma\.role\.findMany\(\);/g, /,\s*roles/g],
  ['', '']
);

// master users
replaceInFile('app/api/master/users/route.ts',
  [/,\s*role:\s*true/g, /const roles\s*=\s*await prisma\.role\.findMany\(\);/g, /roles/g],
  ['', '', '']
);

// permissions/modules api
if (fs.existsSync('app/api/permissions/modules/route.ts')) {
    fs.unlinkSync('app/api/permissions/modules/route.ts');
    console.log('Deleted modules route');
}

// users API
replaceInFile('app/api/users/[id]/reset-password/route.ts',
  [/mustChangePassword:\s*true,/g],
  ['']
);

replaceInFile('app/api/users/[id]/route.ts',
  [/,\s*roleId:\s*true/g, /data\.roleId/g, /updateData\.roleId/g],
  ['', 'data.cargo', 'updateData.cargo']
);

replaceInFile('app/api/users/route.ts',
  [/,\s*roleId:\s*true/g, /roleId:\s*data\.roleId,/g, /cargo:\s*data\.cargo,/g, /roleId:\s*true/g, /\(user\.email\)\s*criado com cargo ID \$\{user\.roleId\}/g],
  ['', 'cargo: data.cargo,', 'cargo: data.cargo,', 'cargo: true', '(user.email) criado com cargo ${user.cargo}']
);

// seed
replaceInFile('prisma/seed.ts',
  [/await prisma\.role\.upsert\(\{[\s\S]*?\}\);/g, /roleId:\s*superAdminRole\.id,/g, /mustChangePassword:\s*true,/g],
  ['', 'cargo: "SUPERADMIN",', '']
);

// layouts
replaceInFile('app/(dashboard)/layout.tsx',
  [/\s*mustChangePassword:\s*true,/g, /mustChangePassword:\s*false,/g, /if\s*\(user\.mustChangePassword\)\s*\{[\s\S]*?return\s*redirect\('\/login'\);\s*\}/g],
  ['', '', '']
);

replaceInFile('app/(pdv)/layout.tsx',
  [/\s*mustChangePassword:\s*true,/g, /mustChangePassword:\s*false,/g, /if\s*\(user\.mustChangePassword\)\s*\{[\s\S]*?return\s*redirect\('\/login'\);\s*\}/g],
  ['', '', '']
);

// Check if I missed the 'roleId' in master login
replaceInFile('app/api/master/login/route.ts',
  [/roleId:\s*'master',/g],
  ['cargo: "SUPERADMIN",']
);
