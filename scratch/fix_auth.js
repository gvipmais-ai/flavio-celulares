const fs = require('fs');

let login = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
login = login.replace(/roleId\s*:\s*user\.roleId\s*\|\|\s*'',\s*roleName\s*:\s*user\.role\?.name\s*\|\|\s*'',/g, `cargo: user.cargo,`);
login = login.replace(/,\s*role: \{\s*select: \{\s*name: true\s*\}\s*\}/g, '');
login = login.replace(/mustChangePassword\??:\s*boolean;/g, '');
login = login.replace(/mustChangePassword:\s*user\.mustChangePassword,/g, '');
login = login.replace(/if\s*\(user\.mustChangePassword\)\s*\{\s*responseBody\.mustChangePassword\s*=\s*true;\s*\}/g, '');
login = login.replace(/role: \{\s*id: user\.roleId,\s*name: user\.role\?.name\s*\}/g, `cargo: user.cargo`);

fs.writeFileSync('app/api/auth/login/route.ts', login);

let me = fs.readFileSync('app/api/auth/me/route.ts', 'utf8');
me = me.replace(/,\s*role: \{\s*select: \{\s*name: true\s*\}\s*\}/g, '');
me = me.replace(/mustChangePassword:\s*true,/g, '');
me = me.replace(/mustChangePassword:\s*user\.mustChangePassword,/g, '');
me = me.replace(/role:\s*user\.role\?.name\s*\|\|\s*'Sem Cargo',/g, 'cargo: user.cargo,');

fs.writeFileSync('app/api/auth/me/route.ts', me);
