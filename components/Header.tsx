'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Lock } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/agenda', label: 'Agenda' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(10,10,10,0.95)'
            : 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(212,120,156,0.2)' : 'none',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="Nail Sosuka"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(link.href) ? '#D4789C' : '#9A8A96',
                  background: isActive(link.href)
                    ? 'rgba(212,120,156,0.12)'
                    : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/agendar"
              className="ml-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D4789C, #A0587C)',
                color: '#F0ECF0',
                boxShadow: '0 0 16px rgba(212,120,156,0.3)',
              }}
            >
              Agendar Agora
            </Link>
            <Link
              href="/admin"
              title="Área Admin"
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/5"
              style={{ color: '#9A8A96' }}
            >
              <Lock size={16} />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#D4789C' }}
            aria-label="Menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden flex flex-col"
          style={{ background: 'rgba(10,10,10,0.97)', paddingTop: '64px' }}
        >
          <nav className="flex flex-col items-center justify-center gap-6 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl font-semibold transition-colors"
                style={{
                  color: isActive(link.href) ? '#D4789C' : '#F0ECF0',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/agendar"
              className="mt-4 px-10 py-4 rounded-full text-lg font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #D4789C, #A0587C)',
                color: '#F0ECF0',
                boxShadow: '0 0 24px rgba(212,120,156,0.4)',
              }}
            >
              Agendar Agora
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
