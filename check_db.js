const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true }});
  const sessions = await prisma.cashSession.findMany();
  console.log('Users:', users);
  console.log('Sessions:', sessions);
}
main().finally(() => prisma.$disconnect());
