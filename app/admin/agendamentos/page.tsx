'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Phone, MessageSquare, Trash2, ChevronDown } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getAppointments, updateAppointmentStatus, deleteAppointment, formatCurrency, formatDate, getWorkingDays, saveWorkingDays } from '@/lib/store';
import { Appointment, WorkingDay } from '@/lib/types';

const STATUS_OPTIONS: { value: Appointment['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendente', color: '#C8883A' },
  { value: 'confirmed', label: 'Confirmado', color: '#D4789C' },
  { value: 'completed', label: 'Concluído', color: '#4ade80' },
  { value: 'cancelled', label: 'Cancelado', color: '#9A8A96' },
];

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'horarios'>('list');

  useEffect(() => {
    setAppointments(getAppointments());
    setWorkingDays(getWorkingDays());
  }, []);

  function refresh() { setAppointments(getAppointments()); }

  function handleStatusChange(id: string, status: Appointment['status']) {
    updateAppointmentStatus(id, status);
    refresh();
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este agendamento?')) return;
    deleteAppointment(id);
    refresh();
  }

  function saveHorarios() {
    saveWorkingDays(workingDays);
    alert('Horários salvos!');
  }

  const filtered = appointments.filter(a => {
    const matchSearch = !search ||
      a.clientName.toLowerCase().includes(search.toLowerCase()) ||
      a.clientPhone.includes(search) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchDate = !selectedDate || a.date === selectedDate;
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const statusInfo = (s: Appointment['status']) => STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0];

  // Calendar helpers
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function getApptCountForDay(day: number) {
    const iso = isoDate(calYear, calMonth, day);
    return appointments.filter(a => a.date === iso && a.status !== 'cancelled').length;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Agendamentos</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>{appointments.length} agendamentos no total</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#12101C' }}>
          {[
            { id: 'list', label: 'Lista' },
            { id: 'calendar', label: 'Calendário' },
            { id: 'horarios', label: 'Horários' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' } : { color: '#9A8A96' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A8A96' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar cliente, serviço..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border"
                  style={{ background: '#12101C', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.2)' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2.5 rounded-xl text-sm border"
                style={{ background: '#12101C', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.2)' }}
              >
                <option value="all">Todos os status</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="px-3 py-2.5 rounded-xl text-xs flex items-center gap-1" style={{ background: 'rgba(212,120,156,0.1)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}>
                  📅 {selectedDate} ✕
                </button>
              )}
            </div>

            {/* Appointments list */}
            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map(a => (
                  <div key={a.id} className="rounded-2xl p-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.12)' }}>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{a.clientName}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${statusInfo(a.status).color}20`, color: statusInfo(a.status).color }}>
                            {statusInfo(a.status).label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#D4789C' }}>{a.serviceName} — {formatCurrency(a.servicePrice)}</p>
                        <p className="text-xs" style={{ color: '#9A8A96' }}>
                          {formatDate(a.date)} às {a.time}
                        </p>
                        {a.notes && <p className="text-xs italic" style={{ color: '#9A8A96' }}>"{a.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Status select */}
                        <div className="relative">
                          <select
                            value={a.status}
                            onChange={e => handleStatusChange(a.id, e.target.value as Appointment['status'])}
                            className="pl-2 pr-6 py-1.5 rounded-lg text-xs font-medium appearance-none cursor-pointer border"
                            style={{ background: `${statusInfo(a.status).color}15`, color: statusInfo(a.status).color, borderColor: `${statusInfo(a.status).color}40` }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusInfo(a.status).color }} />
                        </div>

                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${a.clientPhone.replace(/\D/g, '')}?text=Olá ${a.clientName}! Confirmando seu agendamento de ${a.serviceName} no dia ${formatDate(a.date)} às ${a.time}. 💅`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors hover:bg-green-500/10"
                          title="WhatsApp"
                          style={{ color: '#25D366' }}
                        >
                          <MessageSquare size={16} />
                        </a>

                        {/* Phone */}
                        <a href={`tel:${a.clientPhone}`} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Ligar" style={{ color: '#9A8A96' }}>
                          <Phone size={16} />
                        </a>

                        {/* Delete */}
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: '#9A8A96' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
                <p className="text-3xl mb-2">📋</p>
                <p style={{ color: '#9A8A96' }}>Nenhum agendamento encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}><ChevronLeft size={18} /></button>
                <h2 className="font-bold" style={{ color: '#F0ECF0' }}>{MONTH_LABELS[calMonth]} {calYear}</h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#D4789C' }}><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-semibold px-4 pt-4 pb-2" style={{ color: '#9A8A96' }}>
                {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 px-4 pb-6">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const iso = isoDate(calYear, calMonth, day);
                  const count = getApptCountForDay(day);
                  const sel = selectedDate === iso;
                  return (
                    <button key={day} onClick={() => setSelectedDate(sel ? null : iso)}
                      className="aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105"
                      style={sel ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' } : { background: '#1C1828', color: '#F0ECF0', border: '1px solid rgba(212,120,156,0.15)' }}>
                      <span>{day}</span>
                      {count > 0 && <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center" style={{ background: sel ? 'rgba(255,255,255,0.3)' : '#D4789C', color: 'white', fontSize: '10px' }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#F0ECF0' }}>
                  Agendamentos — {formatDate(selectedDate)}
                </h3>
                {appointments.filter(a => a.date === selectedDate && a.status !== 'cancelled')
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl p-3 mb-2" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.12)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 text-xs font-bold text-center py-1 rounded-lg" style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C' }}>{a.time}</div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#F0ECF0' }}>{a.clientName}</p>
                          <p className="text-xs" style={{ color: '#9A8A96' }}>{a.serviceName}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${statusInfo(a.status).color}20`, color: statusInfo(a.status).color }}>
                        {statusInfo(a.status).label}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Horários Tab */}
        {activeTab === 'horarios' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-1" style={{ color: '#F0ECF0' }}>Horários de Funcionamento</h2>
              <p className="text-sm" style={{ color: '#9A8A96' }}>Configure os dias e horários de atendimento.</p>
            </div>

            <div className="space-y-3">
              {workingDays.map((wd, i) => (
                <div key={wd.dayOfWeek} className="flex items-center gap-4 rounded-xl p-4 flex-wrap" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.12)' }}>
                  <div className="w-20">
                    <p className="font-medium text-sm" style={{ color: wd.open ? '#F0ECF0' : '#9A8A96' }}>{wd.label}</p>
                  </div>

                  <button
                    onClick={() => setWorkingDays(wds => wds.map((w, idx) => idx === i ? { ...w, open: !w.open } : w))}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={wd.open ? { background: 'rgba(212,120,156,0.15)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' } : { background: 'rgba(154,138,150,0.1)', color: '#9A8A96', border: '1px solid rgba(154,138,150,0.2)' }}
                  >
                    {wd.open ? 'Aberto' : 'Fechado'}
                  </button>

                  {wd.open && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={wd.startTime}
                        onChange={e => setWorkingDays(wds => wds.map((w, idx) => idx === i ? { ...w, startTime: e.target.value } : w))}
                        className="px-2 py-1.5 rounded-lg text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
                      <span className="text-xs" style={{ color: '#9A8A96' }}>até</span>
                      <input type="time" value={wd.endTime}
                        onChange={e => setWorkingDays(wds => wds.map((w, idx) => idx === i ? { ...w, endTime: e.target.value } : w))}
                        className="px-2 py-1.5 rounded-lg text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={saveHorarios}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 20px rgba(212,120,156,0.3)' }}>
              Salvar Horários
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
