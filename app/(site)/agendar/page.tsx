'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, MapPin, Car, Info, Check, Tag } from 'lucide-react';
import {
  getActiveServices, getActiveCombos, getAvailableSlots, saveAppointment,
  generateId, formatCurrency, formatDate, notifyOwnerWhatsApp, getTransportPricePerBand,
} from '@/lib/store';
import {
  calcTransportFromCep, calcSignal,
  SIGNAL_PERCENT, CANCELLATION_HOURS, CANCELLATION_REFUND_PERCENT,
  TransportResult,
} from '@/lib/transport';
import { Service, Combo } from '@/lib/types';

const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function maskCep(v: string) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

type SelectionMode = 'services' | 'combo';

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const today = new Date();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [pricePerBand, setPricePerBand] = useState(3);

  // Selection state
  const [mode, setMode] = useState<SelectionMode>('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    searchParams.get('servico') ? [searchParams.get('servico')!] : []
  );
  const [selectedComboId, setSelectedComboId] = useState<string>('');

  // Calendar
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(searchParams.get('data') ?? '');
  const [selectedTime, setSelectedTime] = useState(searchParams.get('horario') ?? '');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Transport
  const [cep, setCep] = useState('');
  const [transport, setTransport] = useState<TransportResult | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // Form
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setServices(getActiveServices());
    setCombos(getActiveCombos());
    setPricePerBand(getTransportPricePerBand());
  }, []);

  useEffect(() => {
    if (selectedDate) setAvailableSlots(getAvailableSlots(selectedDate));
  }, [selectedDate]);

  // Computed totals
  const selectedCombo = combos.find(c => c.id === selectedComboId);
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));

  const totalPrice = mode === 'combo'
    ? (selectedCombo?.price ?? 0)
    : selectedServices.reduce((sum, s) => sum + s.price, 0);

  const totalDuration = mode === 'combo'
    ? (selectedCombo?.duration ?? 0)
    : selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const selectionName = mode === 'combo'
    ? (selectedCombo?.name ?? '')
    : selectedServices.map(s => s.name).join(' + ');

  const hasSelection = mode === 'combo' ? !!selectedComboId : selectedServiceIds.length > 0;

  const originalPrice = mode === 'combo' && selectedCombo
    ? services.filter(s => selectedCombo.serviceIds.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0)
    : 0;
  const hasDiscount = mode === 'combo' && originalPrice > 0 && (selectedCombo?.price ?? 0) < originalPrice;

  const signal = calcSignal(totalPrice);
  const transportCost = transport?.cost ?? 0;
  const grandTotal = totalPrice + transportCost;
  const remaining = grandTotal - signal;

  function toggleService(id: string) {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleCepChange(value: string) {
    const masked = maskCep(value);
    setCep(masked);
    setCepError('');
    setTransport(null);
    const clean = masked.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const result = await calcTransportFromCep(clean);
        if (result) setTransport(result);
        else setCepError('CEP não encontrado. Verifique e tente novamente.');
      } catch {
        setCepError('Erro ao buscar CEP. Verifique sua conexão e tente novamente.');
      } finally {
        setLoadingCep(false);
      }
    }
  }

  // Calendar helpers
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  function isPast(day: number) { const d = new Date(year, month, day); const t = new Date(); t.setHours(0,0,0,0); return d < t; }
  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }
  function getDayStyle(day: number) {
    const iso = isoDate(year, month, day);
    const sel = selectedDate === iso;
    const isToday = iso === isoDate(today.getFullYear(), today.getMonth(), today.getDate());
    if (sel) return { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', cursor: 'pointer' };
    if (isPast(day)) return { color: 'rgba(240,236,240,0.2)', cursor: 'default' };
    if (isToday) return { background: 'rgba(212,120,156,0.2)', color: '#D4789C', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.5)' };
    return { background: '#1C1828', color: '#F0ECF0', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.15)' };
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) { setError('Por favor preencha nome e telefone.'); return; }
    if (!transport) { setError('Por favor informe seu CEP para calcular o deslocamento.'); return; }
    setError(''); setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const appt = {
      id: generateId(),
      clientName: form.name.trim(),
      clientPhone: form.phone.trim(),
      clientEmail: form.email.trim(),
      serviceId: mode === 'combo' ? `combo:${selectedComboId}` : selectedServiceIds.join(','),
      serviceName: selectionName,
      servicePrice: totalPrice,
      serviceDuration: totalDuration,
      date: selectedDate,
      time: selectedTime,
      status: 'pending' as const,
      notes: [
        form.notes.trim(),
        `Endereço: ${transport.address} (CEP ${cep})`,
        `Frete: ${transport.free ? 'Grátis' : formatCurrency(transportCost)} (${transport.distanceKm} km)`,
      ].filter(Boolean).join(' | '),
      createdAt: new Date().toISOString(),
    };
    saveAppointment(appt);
    notifyOwnerWhatsApp(appt);
    setSubmitting(false);
    setSuccess(true);
  }

  const canStep2 = hasSelection;
  const canStep3 = selectedDate && selectedTime;

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(212,120,156,0.15)', border: '2px solid #D4789C' }}>
            <CheckCircle size={40} style={{ color: '#D4789C' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#F0ECF0' }}>Agendamento Confirmado!</h2>
          <p className="mb-1 font-medium" style={{ color: '#D4789C' }}>{selectionName}</p>
          <p className="mb-1" style={{ color: '#9A8A96' }}>{formatDate(selectedDate)} às {selectedTime}</p>
          {transport && <p className="mb-1 text-sm" style={{ color: '#9A8A96' }}>📍 {transport.address} — Frete: {transport.free ? 'Grátis' : formatCurrency(transportCost)}</p>}
          <p className="text-sm mt-4 mb-2" style={{ color: '#9A8A96' }}>
            Entraremos em contato pelo WhatsApp para combinar o pagamento do sinal de{' '}
            <strong style={{ color: '#D4789C' }}>{formatCurrency(signal)}</strong> ({SIGNAL_PERCENT}%).
          </p>
          <p className="text-xs mb-8 px-4 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
            ⚠️ O sinal não é reembolsável. Cancelamentos com mais de {CANCELLATION_HOURS}h de antecedência recebem {CANCELLATION_REFUND_PERCENT}% de volta.
          </p>
          <button onClick={() => router.push('/')} className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Atendimento a Domicílio</p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#F0ECF0' }}>Agendar Horário</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[{ n: 1, label: 'Serviços' }, { n: 2, label: 'Data & Hora' }, { n: 3, label: 'Endereço & Dados' }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={step >= n ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' } : { background: '#1C1828', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }}>
                  {n}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: step >= n ? '#D4789C' : '#9A8A96' }}>{label}</span>
              </div>
              {n < 3 && <div className="w-6 md:w-12 h-px mb-4" style={{ background: step > n ? '#D4789C' : 'rgba(212,120,156,0.2)' }} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Seleção ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#12101C' }}>
              <button onClick={() => setMode('services')}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={mode === 'services' ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' } : { color: '#9A8A96' }}>
                💅 Serviços avulsos
              </button>
              <button onClick={() => setMode('combo')}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={mode === 'combo' ? { background: 'linear-gradient(135deg, #C8883A, #A06828)', color: '#F0ECF0' } : { color: '#9A8A96' }}>
                <Tag size={14} /> Combos
              </button>
            </div>

            {/* Serviços avulsos — multi-select */}
            {mode === 'services' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: '#9A8A96' }}>Selecione um ou mais serviços:</p>
                {services.map(s => {
                  const selected = selectedServiceIds.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleService(s.id)}
                      className="w-full text-left rounded-2xl p-4 transition-all"
                      style={selected
                        ? { background: 'rgba(212,120,156,0.12)', border: '2px solid #D4789C' }
                        : { background: '#1C1828', border: '1px solid rgba(212,120,156,0.15)' }}>
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                          style={selected ? { background: '#D4789C' } : { border: '2px solid rgba(212,120,156,0.4)' }}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-xl">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{s.name}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#9A8A96' }}>{s.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(s.price)}</p>
                          <p className="text-xs" style={{ color: '#9A8A96' }}>{s.duration} min</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Combos */}
            {mode === 'combo' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: '#9A8A96' }}>Escolha um combo com desconto especial:</p>
                {combos.length === 0 && (
                  <p className="text-center py-8" style={{ color: '#9A8A96' }}>Nenhum combo disponível no momento.</p>
                )}
                {combos.map(c => {
                  const selected = selectedComboId === c.id;
                  const comboServices = services.filter(s => c.serviceIds.includes(s.id));
                  const sumPrice = comboServices.reduce((sum, s) => sum + s.price, 0);
                  const discount = sumPrice > c.price ? sumPrice - c.price : 0;
                  return (
                    <button key={c.id} onClick={() => setSelectedComboId(c.id)}
                      className="w-full text-left rounded-2xl p-4 transition-all"
                      style={selected
                        ? { background: 'rgba(200,136,58,0.12)', border: '2px solid #C8883A' }
                        : { background: '#1C1828', border: '1px solid rgba(200,136,58,0.2)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                          style={selected ? { background: '#C8883A' } : { border: '2px solid rgba(200,136,58,0.4)' }}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="text-xl shrink-0">{c.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{c.name}</p>
                            {discount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                                Economize {formatCurrency(discount)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: '#9A8A96' }}>{c.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {comboServices.map((s, i) => (
                              <span key={`${s.id}-${i}`} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,136,58,0.1)', color: '#C8883A' }}>
                                {s.emoji} {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {discount > 0 && (
                            <p className="text-xs line-through" style={{ color: '#9A8A96' }}>{formatCurrency(sumPrice)}</p>
                          )}
                          <p className="font-bold" style={{ color: '#C8883A' }}>{formatCurrency(c.price)}</p>
                          <p className="text-xs" style={{ color: '#9A8A96' }}>{c.duration} min</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Running total */}
            {hasSelection && (
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(212,120,156,0.08)', border: '1px solid rgba(212,120,156,0.2)' }}>
                <div>
                  <p className="text-xs" style={{ color: '#9A8A96' }}>
                    {mode === 'services' ? `${selectedServiceIds.length} serviço(s) selecionado(s) · ${totalDuration} min` : `${totalDuration} min`}
                  </p>
                  <p className="text-sm font-medium truncate max-w-xs" style={{ color: '#F0ECF0' }}>{selectionName}</p>
                </div>
                <p className="font-bold text-lg shrink-0" style={{ color: '#D4789C' }}>{formatCurrency(totalPrice)}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!canStep2}
                className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Data & Hora ── */}
        {step === 2 && (
          <div className="space-y-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm" style={{ color: '#9A8A96' }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            {/* Resumo seleção */}
            <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(212,120,156,0.08)', border: '1px solid rgba(212,120,156,0.2)' }}>
              <div>
                <p className="text-xs" style={{ color: '#9A8A96' }}>{totalDuration} min</p>
                <p className="text-sm font-medium" style={{ color: '#F0ECF0' }}>{selectionName}</p>
              </div>
              <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(totalPrice)}</p>
            </div>

            {/* Calendário */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}><ChevronLeft size={18} /></button>
                <span className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{MONTH_LABELS[month]} {year}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-medium px-3 pt-3 pb-1" style={{ color: '#9A8A96' }}>
                {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => { if (!isPast(day)) { setSelectedDate(isoDate(year, month, day)); setSelectedTime(''); } }}
                    disabled={isPast(day)}
                    className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all hover:scale-105 disabled:cursor-not-allowed"
                    style={getDayStyle(day)}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="font-medium mb-3 text-sm" style={{ color: '#F0ECF0' }}>Horários — {formatDate(selectedDate)}</p>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map(slot => (
                      <button key={slot} onClick={() => setSelectedTime(slot)}
                        className="py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={selectedTime === slot
                          ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }
                          : { background: '#1C1828', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}>
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#9A8A96' }}>Sem horários disponíveis neste dia.</p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setStep(3)} disabled={!canStep3}
                className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Endereço + Dados ── */}
        {step === 3 && (
          <div className="space-y-5">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm" style={{ color: '#9A8A96' }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            {/* CEP */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: '#12101C', border: '1px solid rgba(200,136,58,0.3)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Car size={16} style={{ color: '#C8883A' }} />
                <h3 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>Taxa de Deslocamento</h3>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9A8A96' }}>Seu CEP *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A8A96' }} />
                  <input type="text" value={cep} onChange={e => handleCepChange(e.target.value)}
                    placeholder="00000-000" maxLength={9}
                    className="w-full pl-8 pr-10 py-3 rounded-xl text-sm border"
                    style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(200,136,58,0.3)' }} />
                  {loadingCep && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#C8883A' }} />}
                </div>
              </div>
              {cepError && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle size={13} /> {cepError}</p>}
              {transport && (
                <div className="rounded-xl p-3 space-y-1" style={{ background: '#1C1828', border: '1px solid rgba(200,136,58,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: '#F0ECF0' }}>📍 {transport.address}</p>
                  <p className="font-bold text-sm" style={{ color: transport.free ? '#4ade80' : '#C8883A' }}>
                    {transport.free ? '✓ Deslocamento Grátis!' : `Taxa de deslocamento: ${formatCurrency(transportCost)}`}
                  </p>
                </div>
              )}
            </div>

            {/* Resumo financeiro */}
            {transport && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#D4789C' }}>Resumo do Agendamento</p>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8A96' }}>Serviço(s)</span><span style={{ color: '#F0ECF0' }}>{selectionName}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8A96' }}>Data</span><span style={{ color: '#F0ECF0' }}>{formatDate(selectedDate)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8A96' }}>Horário</span><span style={{ color: '#F0ECF0' }}>{selectedTime}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8A96' }}>Duração estimada</span><span style={{ color: '#F0ECF0' }}>{totalDuration} min</span></div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#9A8A96' }}>Desconto do combo</span>
                    <span style={{ color: '#4ade80' }}>- {formatCurrency(originalPrice - (selectedCombo?.price ?? 0))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm"><span style={{ color: '#9A8A96' }}>Valor dos serviços</span><span style={{ color: '#F0ECF0' }}>{formatCurrency(totalPrice)}</span></div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9A8A96' }}>Deslocamento</span>
                  <span style={{ color: transport.free ? '#4ade80' : '#C8883A' }}>{transport.free ? 'Grátis' : formatCurrency(transportCost)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid rgba(212,120,156,0.1)' }}>
                  <span style={{ color: '#9A8A96' }}>Total</span>
                  <span style={{ color: '#F0ECF0' }}>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="rounded-xl p-3 mt-1 space-y-1" style={{ background: 'rgba(212,120,156,0.07)', border: '1px solid rgba(212,120,156,0.2)' }}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span style={{ color: '#D4789C' }}>Sinal ({SIGNAL_PERCENT}%) — pagar agora</span>
                    <span style={{ color: '#D4789C' }}>{formatCurrency(signal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#9A8A96' }}>Restante no dia</span>
                    <span style={{ color: '#9A8A96' }}>{formatCurrency(remaining)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Política */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Info size={14} style={{ color: '#f87171' }} />
                <p className="font-semibold text-sm" style={{ color: '#f87171' }}>Política de Cancelamento</p>
              </div>
              <ul className="text-xs space-y-1.5" style={{ color: '#9A8A96' }}>
                <li>⚠️ O sinal de <strong style={{ color: '#F0ECF0' }}>{SIGNAL_PERCENT}%</strong> é cobrado para confirmar e <strong style={{ color: '#f87171' }}>não é reembolsável</strong>.</li>
                <li>🔄 Cancelamentos com mais de <strong style={{ color: '#F0ECF0' }}>{CANCELLATION_HOURS}h</strong> de antecedência: <strong style={{ color: '#F0ECF0' }}>{CANCELLATION_REFUND_PERCENT}% do sinal devolvido</strong>.</li>
                <li>❌ Cancelamentos com menos de {CANCELLATION_HOURS}h: sinal perdido integralmente.</li>
                <li>✅ O sinal é <strong style={{ color: '#F0ECF0' }}>descontado do total</strong> no dia do atendimento.</li>
              </ul>
            </div>

            {/* Dados */}
            <div className="space-y-4">
              <h2 className="font-semibold" style={{ color: '#F0ECF0' }}>Seus Dados</h2>
              {[
                { key: 'name', label: 'Nome completo *', type: 'text', placeholder: 'Seu nome' },
                { key: 'phone', label: 'WhatsApp *', type: 'tel', placeholder: '(15) 99999-9999' },
                { key: 'email', label: 'E-mail (opcional)', type: 'email', placeholder: 'seu@email.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>{field.label}</label>
                  <input type={field.type} value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm border"
                    style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>Observações</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Cor preferida, design, endereço completo..."
                  className="w-full rounded-xl px-4 py-3 text-sm border resize-none"
                  style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(200,50,50,0.1)', border: '1px solid rgba(200,50,50,0.3)', color: '#f87171' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !transport}
              className="w-full py-4 rounded-full font-bold text-lg transition-all hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 24px rgba(212,120,156,0.35)' }}>
              {submitting ? <><Loader2 size={20} className="animate-spin" /> Confirmando...</> : `Confirmar — Sinal ${formatCurrency(signal)}`}
            </button>
            <p className="text-xs text-center" style={{ color: '#9A8A96' }}>
              Após confirmar, entraremos em contato pelo WhatsApp para combinar o pagamento do sinal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: '#D4789C' }} /></div>}>
      <BookingForm />
    </Suspense>
  );
}
