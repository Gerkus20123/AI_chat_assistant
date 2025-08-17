import './globals.css'; // Import globalnych stylów Tailwind CSS
import { Inter } from 'next/font/google';
import React, { ReactNode } from 'react'; // Importujemy ReactNode do typowania

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Asystent Web',
  description: 'Prosty asystent AI stworzony w Next.js i Gemini API.',
};

/**
 * Definiuje typ dla propsów komponentu RootLayout
 */
interface RootLayoutProps {
  children: ReactNode; // children może być dowolnym węzłem React
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-gray-100 flex items-center justify-center min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
