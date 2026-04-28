'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Sparkles, CalendarCheck, Star } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import { getActiveServices } from '@/lib/store';
import { Service } from '@/lib/types';

const STEPS = [
  { icon: <Sparkles size={22} />, title: 'Escolha o Serviço', desc: 'Navegue pelos nossos serviços e escolha o que mais combina com você.' },
  { icon: <CalendarCheck size={22} />, title: 'Selecione Data e Horário', desc: 'Veja os horários disponíveis e escolha o mais conveniente.' },
  { icon: <Star size={22} />, title: 'Confirme e Apareça', desc: 'Receba a confirmação e venha arrasar com suas novas unhas!' },
];

const DIFERENCIAIS = [
  { icon: '⏱️', title: 'Pontualidade', desc: 'Respeitamos o seu tempo. Agendamentos sem espera desnecessária.' },
  { icon: '🛡️', title: 'Higiene Total', desc: 'Materiais esterilizados e ambiente sempre limpo para sua segurança.' },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    setServices(getActiveServices().slice(0, 4));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90dvh] flex flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,120,156,0.18) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(160,88,124,0.08)', filter: 'blur(80px)' }} />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <Image src="/logo.jpeg" alt="Nail Sosuka" width={280} height={100} className="w-52 md:w-72 h-auto object-contain" priority />

          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              <span className="gradient-text">Arte nas Unhas,</span>
              <br />
              <span style={{ color: '#F0ECF0' }}>Elegância em Cada Detalhe</span>
            </h1>
            <p className="text-base md:text-lg max-w-md mx-auto" style={{ color: '#9A8A96' }}>
              Manicure profissional e alongamento de unhas com qualidade premium. Agende online em segundos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
            <Link
              href="/agendar"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 28px rgba(212,120,156,0.4)' }}
            >
              Agendar Agora <ArrowRight size={20} />
            </Link>
            <Link
              href="/servicos"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 border"
              style={{ borderColor: 'rgba(212,120,156,0.4)', color: '#D4789C', background: 'rgba(212,120,156,0.06)' }}
            >
              Ver Serviços
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
            {['5★ Avaliação', 'Agendamento Online', 'Higiene Garantida'].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(212,120,156,0.1)', color: '#D4789C' }}>
                <Shield size={11} /> {b}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-px h-8 mx-auto" style={{ background: 'linear-gradient(to bottom, #D4789C, transparent)' }} />
        </div>
      </section>

      {/* Diferenciais */}
      <section className="px-4 py-16" style={{ background: '#12101C' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Por que escolher a Nail Sosuka?</p>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#F0ECF0' }}>Experiência que faz a diferença</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIFERENCIAIS.map((d) => (
              <div key={d.title} className="rounded-2xl p-5 flex flex-col gap-3 text-center transition-all hover:-translate-y-1" style={{ background: '#1C1828', border: '1px solid rgba(212,120,156,0.12)' }}>
                <span className="text-4xl">{d.icon}</span>
                <h3 className="font-semibold" style={{ color: '#F0ECF0' }}>{d.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9A8A96' }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#D4789C' }}>Nossos Serviços</p>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#F0ECF0' }}>O que oferecemos</h2>
            </div>
            <Link href="/servicos" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#D4789C' }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-36 animate-pulse" style={{ background: '#1C1828' }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="px-4 py-16" style={{ background: '#12101C' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Simples assim</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-10" style={{ color: '#F0ECF0' }}>Como Agendar</h2>
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-0">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col md:flex-row items-center flex-1">
                <div className="flex flex-col items-center text-center gap-3 px-4 w-full">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,120,156,0.2), rgba(160,88,124,0.2))', border: '1px solid rgba(212,120,156,0.3)', color: '#D4789C' }}>
                    {step.icon}
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#D4789C', color: 'white' }}>{i + 1}</div>
                  <h3 className="font-semibold" style={{ color: '#F0ECF0' }}>{step.title}</h3>
                  <p className="text-sm" style={{ color: '#9A8A96' }}>{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(212,120,156,0.4), transparent)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #1C1828, #261E34)', border: '1px solid rgba(212,120,156,0.25)', boxShadow: '0 0 60px rgba(212,120,156,0.1)' }}>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Pronta para arrasar?</span>
            </h2>
            <p className="mb-8 text-base" style={{ color: '#9A8A96' }}>
              Agende agora mesmo e garanta seu horário. Em poucos cliques suas unhas dos sonhos ficam marcadas.
            </p>
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 32px rgba(212,120,156,0.5)' }}
            >
              Agendar Meu Horário <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
