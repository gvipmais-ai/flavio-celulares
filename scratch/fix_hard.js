const fs = require('fs');

function replace(path, regexes, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  let original = content;
  for (let i = 0; i < regexes.length; i++) {
    content = content.replace(regexes[i], replacements[i]);
  }
  if (content !== original) {
    fs.writeFileSync(path, content);
    console.log('Fixed', path);
  }
}

// Layouts
replace('app/(dashboard)/layout.tsx',
  [/mustChangePassword:\s*user\.mustChangePassword,/g, /roleName:\s*session\.roleName,/g, /roleName:\s*string;/g, /mustChangePassword\s*:\s*boolean;/g],
  ['', 'cargo: session.cargo,', 'cargo: string;', '']
);

replace('app/(pdv)/layout.tsx',
  [/mustChangePassword:\s*user\.mustChangePassword,/g, /roleName:\s*session\.roleName,/g, /roleName:\s*string;/g, /mustChangePassword\s*:\s*boolean;/g],
  ['', 'cargo: session.cargo,', 'cargo: string;', '']
);

// Admin / Users Route
replace('app/api/admin/users/route.ts',
  [/role:\s*true/g, /role:\s*u\.role\.name/g, /role:\s*u\.cargo\.name/g, /roleId:\s*u\.roleId/g, /cargo:\s*u\.cargo\.name/g, /cargo:\s*u\.cargo/g],
  ['permissoes: true', 'cargo: u.cargo', 'cargo: u.cargo', 'cargo: u.cargo', 'cargo: u.cargo', 'cargo: u.cargo']
);

// Users API Validations
replace('app/api/users/[id]/route.ts',
  [/roleId\?:/g, /roleId:/g, /roleId:\s*true/g, /mustChangePassword:\s*true/g],
  ['cargo?:', 'cargo:', 'cargo: true', '']
);

replace('app/api/users/route.ts',
  [/roleId:/g, /roleId:\s*true/g, /role:\s*true/g, /mustChangePassword:\s*true/g],
  ['cargo:', 'cargo: true', 'cargo: true', '']
);

// Remove role references
replace('app/api/admin/logs/route.ts', [/role:\s*true/g], ['']);
replace('app/api/admin/users/[id]/route.ts', [/role:\s*true/g, /role:\s*user\.role\.name/g, /cargo:\s*user\.cargo\.name/g, /role:\s*user\.cargo/g], ['', 'cargo: user.cargo', 'cargo: user.cargo', 'cargo: user.cargo']);
replace('app/api/backup/export/route.ts', [/role:\s*true/g], ['']);
replace('app/api/master/database/backup/route.ts', [/role:\s*true/g], ['']);
replace('app/api/master/database/reset/route.ts', [/role:\s*true/g], ['']);
replace('app/api/master/users/route.ts', [/role:\s*true/g], ['']);

// Lib validations (for user updates)
replace('lib/validations.ts',
  [/roleId:\s*z\.string\(\)\.min\(1,\s*'Cargo é obrigatório'\)/g, /roleId:\s*z\.string\(\)\.optional\(\)/g],
  ['cargo: z.enum(["OPERADOR", "TECNICO", "SUPERADMIN"]).default("OPERADOR")', 'cargo: z.enum(["OPERADOR", "TECNICO", "SUPERADMIN"]).optional()']
);
