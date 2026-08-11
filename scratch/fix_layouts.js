const fs = require('fs');

let db = fs.readFileSync('app/(dashboard)/layout.tsx', 'utf8');
db = db.replace(/roleName: string;/g, 'cargo: string;');
db = db.replace(/mustChangePassword\??:\s*boolean;/g, '');
db = db.replace(/const session = await getSession\(\);/g, 'const session = await getSession();');
db = db.replace(/roleName:\s*session\.roleName,/g, 'cargo: session.cargo,');
db = db.replace(/user=\{[^}]+\}/, 'user={{ id: session.sub, name: session.name, email: session.email, cargo: session.cargo }}');
db = db.replace(/,\s*mustChangePassword:\s*user\.mustChangePassword/g, '');
fs.writeFileSync('app/(dashboard)/layout.tsx', db);

let pdv = fs.readFileSync('app/(pdv)/layout.tsx', 'utf8');
pdv = pdv.replace(/roleName: string;/g, 'cargo: string;');
pdv = pdv.replace(/mustChangePassword\??:\s*boolean;/g, '');
pdv = pdv.replace(/roleName:\s*session\.roleName,/g, 'cargo: session.cargo,');
pdv = pdv.replace(/user=\{[^}]+\}/, 'user={{ id: session.sub, name: session.name, email: session.email, cargo: session.cargo }}');
pdv = pdv.replace(/,\s*mustChangePassword:\s*user\.mustChangePassword/g, '');
fs.writeFileSync('app/(pdv)/layout.tsx', pdv);

let pwd = fs.readFileSync('app/api/auth/change-password/route.ts', 'utf8');
pwd = pwd.replace(/mustChangePassword:\s*false,/g, '');
fs.writeFileSync('app/api/auth/change-password/route.ts', pwd);

let backup = fs.readFileSync('app/api/master/database/backup/route.ts', 'utf8');
backup = backup.replace(/const roles = await prisma\.role\.findMany\(\);/g, '');
backup = backup.replace(/,\s*roles/g, '');
fs.writeFileSync('app/api/master/database/backup/route.ts', backup);

let reset = fs.readFileSync('app/api/master/database/reset/route.ts', 'utf8');
reset = reset.replace(/await prisma\.role\.deleteMany\(\);/g, '');
fs.writeFileSync('app/api/master/database/reset/route.ts', reset);

let login = fs.readFileSync('app/api/master/login/route.ts', 'utf8');
login = login.replace(/cargo: "SUPERADMIN",\s*cargo: "SUPERADMIN",/g, 'cargo: "SUPERADMIN",');
fs.writeFileSync('app/api/master/login/route.ts', login);
