import { redirect } from 'next/navigation';
import { getSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { AuthProvider } from '@/components/providers/auth-provider';

export default async function PDVLayout({
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

  const initialUser = session ? {
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    mustChangePassword: false,
  } : null;

  return (
    <AuthProvider initialUser={initialUser}>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-default)]">
        {/* Full screen layout for PDV, without Sidebar and Dashboard Header */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <main className="flex-1 overflow-hidden relative z-0">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
