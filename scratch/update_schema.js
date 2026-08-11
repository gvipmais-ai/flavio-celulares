const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add Cargo enum
if (!schema.includes('enum Cargo')) {
  schema = schema.replace('// ─── Modelos ──────────────────────────────────────────────────────────────────', `// ─── Modelos ──────────────────────────────────────────────────────────────────\n\nenum Cargo {\n  OPERADOR\n  TECNICO\n  SUPERADMIN\n}`);
}

// 2. Modify User model
schema = schema.replace(/  roleId             String\?\n  role               Role\?     @relation\(fields: \[roleId\], references: \[id\]\)\n  isActive           Boolean   @default\(true\)\n  mustChangePassword Boolean   @default\(true\)/g, 
`  cargo              Cargo     @default(OPERADOR)
  permissoes         Json?
  isActive           Boolean   @default(true)`);

// 3. Remove Role model
schema = schema.replace(/model Role \{[\s\S]*?@@map\("roles"\)\n\}\n/g, '');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully');
