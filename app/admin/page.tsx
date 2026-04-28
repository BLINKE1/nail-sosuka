'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { adminLogin, isAdminLoggedIn } from '@/lib/store';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAdminLoggedIn()) router.replace('/admin/dashboard');
    else setChecking(false);
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (adminLogin(password)) {
      router.push('/admin/dashboard');
    } else {
      setError('Senha incorreta. Tente novamente.');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: '#D4789C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.jpeg" alt="Nail Sosuka" width={140} height={50} className="h-12 w-auto object-contain mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest" style={{ color: '#D4789C' }}>Área Administrativa</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} style={{ color: '#D4789C' }} />
            <h2 className="font-semibold" style={{ color: '#F0ECF0' }}>Entrar no Painel</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>Senha</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full rounded-xl px-4 py-3 text-sm border pr-11"
                style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9A8A96' }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(200,50,50,0.1)', color: '#f87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}
