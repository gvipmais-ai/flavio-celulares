import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
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
                fontFamily: 'Inter, system-ui, sans-serif',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
