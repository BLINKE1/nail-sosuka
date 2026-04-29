'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Scissors, Calendar, Settings, LogOut, Menu, X, Loader2 } from 'lucide-react';
import { isAdminLoggedIn, adminLogout } from '@/lib/store';

const NAV = [
  { href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/admin/servicos', icon: <Scissors size={18} />, label: 'Serviços' },
  { href: '/admin/agendamentos', icon: <Calendar size={18} />, label: 'Agendamentos' },
  { href: '/admin/configuracoes', icon: <Settings size={18} />, label: 'Configurações' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) router.replace('/admin');
    else setChecking(false);
  }, [router]);

  function handleLogout() {
    adminLogout();
    router.push('/admin');
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#D4789C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{ background: '#12101C', borderRight: '1px solid rgba(212,120,156,0.15)' }}
      >
        <div className="p-5" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
          <Image src="/logo.jpeg" alt="Nail Sosuka" width={120} height={42} className="h-10 w-auto object-contain" />
          <p className="text-xs mt-1" style={{ color: '#9A8A96' }}>Painel Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={pathname === item.href
                ? { background: 'rgba(212,120,156,0.15)', color: '#D4789C' }
                : { color: '#9A8A96' }
              }
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10"
            style={{ color: '#9A8A96' }}
          >
            <LogOut size={18} /> Sair
          </button>
          <Link
            href="/"
            className="mt-1 flex items-center justify-center text-xs py-2 rounded-xl transition-all"
            style={{ color: '#9A8A96' }}
          >
            ← Ver site
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-64 flex flex-col" style={{ background: '#12101C', borderRight: '1px solid rgba(212,120,156,0.15)' }}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
              <Image src="/logo.jpeg" alt="Nail Sosuka" width={100} height={36} className="h-9 w-auto object-contain" />
              <button onClick={() => setSideOpen(false)} style={{ color: '#9A8A96' }}><X size={20} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={pathname === item.href ? { background: 'rgba(212,120,156,0.15)', color: '#D4789C' } : { color: '#9A8A96' }}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-3">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm" style={{ color: '#9A8A96' }}>
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSideOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14" style={{ background: '#12101C', borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
          <button onClick={() => setSideOpen(true)} style={{ color: '#D4789C' }}>
            <Menu size={22} />
          </button>
          <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>
            {NAV.find(n => n.href === pathname)?.label ?? 'Admin'}
          </p>
          <button onClick={handleLogout} style={{ color: '#9A8A96' }}>
            <LogOut size={18} />
          </button>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
