import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Weather Dashboard',
  description: 'Real-time weather monitoring with recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-100 dark:bg-gray-900">
      <body className={`${inter.className} h-full`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto py-6 px-4">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}