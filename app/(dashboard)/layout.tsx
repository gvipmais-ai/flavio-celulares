import { redirect } from 'next/navigation';
import { getSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { mustChangePassword: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/alterar-senha?obrigatorio=true');
  }

  const result = await prisma.$queryRaw<[{ count: bigint | number }]>`
    SELECT COUNT(*) as count FROM products 
    WHERE isActive = 1 AND approvalStatus = 'APROVADO' 
    AND stockOnHand <= minimumStock AND stockOnHand >= 0
  `;
  const lowStockCount = Number(result[0]?.count ?? 0);

  const initialUser = session ? {
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    mustChangePassword: false,
  } : null;

  return (
    <AuthProvider initialUser={initialUser}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-default)]">
        <Sidebar lowStockCount={lowStockCount} />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* Watermark Logo */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05] bg-center bg-no-repeat bg-[url('/images/logo-v5.png')] bg-[length:50%] mix-blend-luminosity z-0" />
          
          <div className="relative z-10 flex flex-col h-full w-full">
            <Header session={session} />
            <main className="flex-1 overflow-y-auto p-6 relative z-0">{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
