import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import StoreSync from '@/components/StoreSync';
import GlitterCanvas from '@/components/GlitterCanvas';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Nail Sosuka | Manicure & Alongamento',
  description: 'Agendamento online de manicure e alongamento de unhas. Arte nas unhas, elegância em cada detalhe.',
  keywords: ['manicure', 'alongamento de unhas', 'nail art', 'agendamento online'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4789C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nail Sosuka" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <GlitterCanvas />
        <StoreSync />
        {children}
      </body>
    </html>
  );
}
