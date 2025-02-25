import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { WebSocketProvider } from '@/components/providers/websocket-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { LanguageProvider } from '@/providers/language-provider';
import { Toaster } from '@/components/ui/toaster';
import { TokenChecker } from '@/components/auth/token-checker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Garden IoT',
  description: 'AI-powered garden monitoring and automation system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <WebSocketProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <TokenChecker />
                  {children}
                  <Toaster />
                </ThemeProvider>
              </WebSocketProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

