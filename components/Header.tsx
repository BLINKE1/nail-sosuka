'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Lock, Download } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/agenda', label: 'Agenda' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSTip(v => !v);
    }
  }

  const showInstallButton = !isStandalone && (!!deferredPrompt || isIOS);

  const InstallButton = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="relative">
      <button
        onClick={handleInstall}
        className={`flex items-center gap-1.5 font-semibold transition-all duration-200 hover:opacity-80 ${
          mobile ? 'px-8 py-3 rounded-full text-base' : 'px-4 py-2 rounded-full text-sm'
        }`}
        style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}
      >
        <Download size={mobile ? 18 : 14} />
        Baixar App
      </button>
      {showIOSTip && (
        <div
          className="absolute top-full mt-2 right-0 w-56 p-3 rounded-xl text-xs z-50"
          style={{ background: '#1C1828', border: '1px solid rgba(212,120,156,0.3)', color: '#9A8A96' }}
        >
          No Safari: toque em <strong style={{ color: '#D4789C' }}>Compartilhar ⎙</strong> → <strong style={{ color: '#D4789C' }}>Adicionar à Tela de Início</strong>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(10,10,10,0.95)' : 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(212,120,156,0.2)' : 'none',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
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
                  background: isActive(link.href) ? 'rgba(212,120,156,0.12)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            {showInstallButton && <InstallButton />}
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
                style={{ color: isActive(link.href) ? '#D4789C' : '#F0ECF0' }}
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
            {showInstallButton && (
              <div className="relative flex flex-col items-center gap-2">
                <InstallButton mobile />
                {showIOSTip && (
                  <p className="text-xs text-center px-6" style={{ color: '#9A8A96' }}>
                    No Safari: toque em <strong style={{ color: '#D4789C' }}>Compartilhar ⎙</strong> → <strong style={{ color: '#D4789C' }}>Adicionar à Tela de Início</strong>
                  </p>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
