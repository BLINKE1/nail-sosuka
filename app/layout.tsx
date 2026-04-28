import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Nail Sosuka | Manicure & Alongamento',
  description: 'Agendamento online de manicure e alongamento de unhas. Arte nas unhas, elegância em cada detalhe.',
  keywords: ['manicure', 'alongamento de unhas', 'nail art', 'agendamento online'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
