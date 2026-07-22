import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Flavio Celulares',
    template: '%s | Flavio Celulares',
  },
  description: 'Sistema de gestão para Flavio Celulares — venda de acessórios e assistência técnica',
  keywords: ['celulares', 'acessórios', 'assistência técnica', 'gestão'],
  robots: 'noindex, nofollow', // Sistema interno
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-default)] text-[var(--text-default)] font-sans antialiased transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div id="print-area" />
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'var(--font-inter)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
