'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getActiveServices, getAvailableSlots, saveAppointment, generateId, formatCurrency, formatDate, notifyOwnerWhatsApp } from '@/lib/store';
import { Service } from '@/lib/types';

const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const today = new Date();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('servico') ?? '');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(searchParams.get('data') ?? '');
  const [selectedTime, setSelectedTime] = useState(searchParams.get('horario') ?? '');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setServices(getActiveServices()); }, []);
  useEffect(() => {
    if (selectedDate) setAvailableSlots(getAvailableSlots(selectedDate));
  }, [selectedDate]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function isPast(day: number) {
    const d = new Date(year, month, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  }

  function handleDayClick(day: number) {
    if (isPast(day)) return;
    const iso = isoDate(year, month, day);
    setSelectedDate(iso);
    setSelectedTime('');
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function getDayStyle(day: number) {
    const iso = isoDate(year, month, day);
    const past = isPast(day);
    const selected = selectedDate === iso;
    const isToday = iso === isoDate(today.getFullYear(), today.getMonth(), today.getDate());
    if (selected) return { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', cursor: 'pointer' };
    if (past) return { color: 'rgba(240,236,240,0.2)', cursor: 'default' };
    if (isToday) return { background: 'rgba(212,120,156,0.2)', color: '#D4789C', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.5)' };
    return { background: '#1C1828', color: '#F0ECF0', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.15)' };
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Por favor preencha nome e telefone.');
      return;
    }
    setError('');
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const newAppointment = {
      id: generateId(),
      clientName: form.name.trim(),
      clientPhone: form.phone.trim(),
      clientEmail: form.email.trim(),
      serviceId: selectedServiceId,
      serviceName: selectedService!.name,
      servicePrice: selectedService!.price,
      date: selectedDate,
      time: selectedTime,
      status: 'pending' as const,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    saveAppointment(newAppointment);
    notifyOwnerWhatsApp(newAppointment);
    setSubmitting(false);
    setSuccess(true);
  }

  const canStep2 = !!selectedServiceId;
  const canStep3 = selectedDate && selectedTime;

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(212,120,156,0.15)', border: '2px solid #D4789C' }}>
            <CheckCircle size={40} style={{ color: '#D4789C' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#F0ECF0' }}>Agendamento Confirmado!</h2>
          <p className="mb-1" style={{ color: '#9A8A96' }}>
            <strong style={{ color: '#D4789C' }}>{selectedService?.name}</strong>
          </p>
          <p className="mb-1" style={{ color: '#9A8A96' }}>{formatDate(selectedDate)} às {selectedTime}</p>
          <p className="text-sm mt-4 mb-8" style={{ color: '#9A8A96' }}>
            Seu agendamento foi recebido com sucesso! Entraremos em contato pelo WhatsApp para confirmar.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
          >
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
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Online</p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#F0ECF0' }}>Agendar Horário</h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { n: 1, label: 'Serviço' },
            { n: 2, label: 'Data & Hora' },
            { n: 3, label: 'Seus Dados' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={step >= n ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' } : { background: '#1C1828', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }}
                >
                  {n}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: step >= n ? '#D4789C' : '#9A8A96' }}>{label}</span>
              </div>
              {n < 3 && <div className="w-8 md:w-16 h-px mb-4" style={{ background: step > n ? '#D4789C' : 'rgba(212,120,156,0.2)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1 - Service */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-4" style={{ color: '#F0ECF0' }}>Escolha o Serviço</h2>
            <div className="grid grid-cols-1 gap-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className="text-left rounded-2xl p-4 transition-all"
                  style={selectedServiceId === s.id
                    ? { background: 'rgba(212,120,156,0.12)', border: '2px solid #D4789C' }
                    : { background: '#1C1828', border: '1px solid rgba(212,120,156,0.15)' }
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{s.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9A8A96' }}>{s.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(s.price)}</p>
                      <p className="text-xs" style={{ color: '#9A8A96' }}>{s.duration} min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canStep2}
                className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 - Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm" style={{ color: '#9A8A96' }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            {selectedService && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(212,120,156,0.08)', border: '1px solid rgba(212,120,156,0.2)' }}>
                <span className="text-xl">{selectedService.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{selectedService.name}</p>
                  <p className="text-xs" style={{ color: '#9A8A96' }}>{selectedService.duration} min</p>
                </div>
                <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(selectedService.price)}</p>
              </div>
            )}

            {/* Mini calendar */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}>
                  <ChevronLeft size={18} />
                </button>
                <span className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{MONTH_LABELS[month]} {year}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-medium px-3 pt-3 pb-1" style={{ color: '#9A8A96' }}>
                {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={isPast(day)}
                    className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all hover:scale-105 disabled:cursor-not-allowed"
                    style={getDayStyle(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="font-medium mb-3 text-sm" style={{ color: '#F0ECF0' }}>
                  Horários disponíveis — {formatDate(selectedDate)}
                </p>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className="py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={selectedTime === slot
                          ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }
                          : { background: '#1C1828', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }
                        }
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#9A8A96' }}>Sem horários disponíveis neste dia.</p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStep(3)}
                disabled={!canStep3}
                className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Personal data */}
        {step === 3 && (
          <div className="space-y-5">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm" style={{ color: '#9A8A96' }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            {/* Summary */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Resumo do Agendamento</p>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9A8A96' }}>Serviço</span>
                <span style={{ color: '#F0ECF0' }}>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9A8A96' }}>Data</span>
                <span style={{ color: '#F0ECF0' }}>{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9A8A96' }}>Horário</span>
                <span style={{ color: '#F0ECF0' }}>{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid rgba(212,120,156,0.1)' }}>
                <span style={{ color: '#9A8A96' }}>Valor</span>
                <span style={{ color: '#D4789C' }}>{formatCurrency(selectedService?.price ?? 0)}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <h2 className="font-semibold" style={{ color: '#F0ECF0' }}>Seus Dados</h2>

              {[
                { key: 'name', label: 'Nome completo *', type: 'text', placeholder: 'Seu nome' },
                { key: 'phone', label: 'WhatsApp *', type: 'tel', placeholder: '(11) 99999-9999' },
                { key: 'email', label: 'E-mail (opcional)', type: 'email', placeholder: 'seu@email.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm border transition-all"
                    style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>Observações</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Alguma observação? (cor preferida, design, etc.)"
                  className="w-full rounded-xl px-4 py-3 text-sm border transition-all resize-none"
                  style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(200,50,50,0.1)', border: '1px solid rgba(200,50,50,0.3)', color: '#f87171' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-full font-bold text-lg transition-all hover:scale-105 disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 24px rgba(212,120,156,0.35)' }}
            >
              {submitting ? <><Loader2 size={20} className="animate-spin" /> Confirmando...</> : 'Confirmar Agendamento'}
            </button>

            <p className="text-xs text-center" style={{ color: '#9A8A96' }}>
              Ao confirmar, você receberá um contato pelo WhatsApp para finalizar seu agendamento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: '#D4789C' }} />
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
}
