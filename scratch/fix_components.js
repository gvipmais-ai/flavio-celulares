const fs = require('fs');

let header = fs.readFileSync('components/layout/header.tsx', 'utf8');
header = header.replace(/roleName: string;/g, 'cargo: string;');
header = header.replace(/session\.roleName/g, 'session.cargo');
header = header.replace(/roleName\[normalizedUserRole\]/g, 'roleLabel[normalizedUserRole]');
header = header.replace(/const roleName: Record<string, string> =/g, 'const roleLabel: Record<string, string> =');
fs.writeFileSync('components/layout/header.tsx', header);

let sidebar = fs.readFileSync('components/layout/sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/user\.roleName/g, 'user.cargo');
fs.writeFileSync('components/layout/sidebar.tsx', sidebar);

let dash = fs.readFileSync('app/(dashboard)/dashboard/page.tsx', 'utf8');
dash = dash.replace(/user\.roleName/g, 'user.cargo');
dash = dash.replace(/user\.cargo === 'SuperADMIN'/g, 'user.cargo === "SUPERADMIN"');
dash = dash.replace(/user\.cargo === 'Operador de Caixa'/g, 'user.cargo === "OPERADOR"');
dash = dash.replace(/user\.cargo === 'Técnico'/g, 'user.cargo === "TECNICO"');
fs.writeFileSync('app/(dashboard)/dashboard/page.tsx', dash);
