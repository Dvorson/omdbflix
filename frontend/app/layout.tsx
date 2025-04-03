import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Movie Explorer - Search and Discover Movies',
  description: 'Find information about your favorite movies, TV shows, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white`}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto my-8 flex-grow px-4">
            {children}
          </main>
          <footer className="mt-auto bg-white py-6 dark:bg-gray-800">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} Movie Explorer. All rights reserved.</p>
              <p className="mt-2">Data provided by OMDb API.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
} 