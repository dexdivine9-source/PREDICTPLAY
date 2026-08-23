import type {Metadata} from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'PredictPlay',
  description: 'The competitive prediction platform for DLS & eFootball players.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="pb-16 md:pb-0 min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
