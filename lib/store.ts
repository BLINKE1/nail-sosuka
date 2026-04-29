'use client';

import { Service, Combo, Appointment, WorkingDay, StoreData } from './types';

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Manicure Tradicional', description: 'Cutícula, lixamento e esmaltação com esmalte comum', price: 35, duration: 45, category: 'manicure', active: true, emoji: '💅' },
  { id: '2', name: 'Manicure em Gel', description: 'Esmaltação em gel com maior duração e brilho intenso', price: 60, duration: 60, category: 'manicure', active: true, emoji: '✨' },
  { id: '3', name: 'Manicure Francesa', description: 'Clássica e elegante, ideal para qualquer ocasião', price: 45, duration: 60, category: 'manicure', active: true, emoji: '🤍' },
  { id: '4', name: 'Nail Art', description: 'Designs exclusivos e personalizados nas unhas', price: 80, duration: 90, category: 'manicure', active: true, emoji: '🎨' },
  { id: '5', name: 'Alongamento em Gel', description: 'Extensão natural com gel para unhas mais longas e resistentes', price: 150, duration: 120, category: 'alongamento', active: true, emoji: '💎' },
  { id: '6', name: 'Alongamento em Acrílico', description: 'Extensão ultra resistente com acabamento impecável', price: 130, duration: 120, category: 'alongamento', active: true, emoji: '🔮' },
  { id: '7', name: 'Manutenção de Alongamento', description: 'Preenchimento e manutenção das unhas alongadas', price: 90, duration: 90, category: 'alongamento', active: true, emoji: '🛠️' },
  { id: '8', name: 'Banho de Gel', description: 'Fortalecimento e brilho com gel de cobertura nas unhas naturais', price: 70, duration: 75, category: 'outros', active: true, emoji: '🌟' },
];

const DEFAULT_COMBOS: Combo[] = [
  {
    id: 'c1',
    name: 'Manicure + Nail Art',
    description: 'Manicure tradicional com uma unha nail art exclusiva',
    price: 100,
    duration: 120,
    serviceIds: ['1', '4'],
    active: true,
    emoji: '💅🎨',
  },
  {
    id: 'c2',
    name: 'Manicure + 2 Nail Arts',
    description: 'Manicure tradicional com duas unhas nail art personalizadas',
    price: 120,
    duration: 150,
    serviceIds: ['1', '4', '4'],
    active: true,
    emoji: '✨🎨',
  },
];

const DEFAULT_WORKING_DAYS: WorkingDay[] = [
  { dayOfWeek: 0, label: 'Domingo', open: false, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 1, label: 'Segunda', open: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 2, label: 'Terça', open: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 3, label: 'Quarta', open: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 4, label: 'Quinta', open: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 5, label: 'Sexta', open: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 6, label: 'Sábado', open: true, startTime: '09:00', endTime: '14:00' },
];

const STORAGE_KEY = 'nail_sosuka_data';
const STORE_VERSION = 2; // bump quando coordenadas de origem mudarem

function getDefaultData(): StoreData {
  return {
    storeVersion: STORE_VERSION,
    services: DEFAULT_SERVICES,
    combos: DEFAULT_COMBOS,
    appointments: [],
    workingDays: DEFAULT_WORKING_DAYS,
    slotDuration: 60,
    adminPassword: 'sosuka2024',
    whatsapp: '5515997789464',
    originCep: '18208340',
    originLat: -23.593187,
    originLon: -48.063192,
    originAddress: 'Rua Kalil Yared, 204, Jardim Alvorada, Itapetininga/SP',
  };
}

export function getData(): StoreData {
  if (typeof window === 'undefined') return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const defaults = getDefaultData();

    const data: StoreData = {
      storeVersion: STORE_VERSION,
      services: parsed.services ?? defaults.services,
      combos: parsed.combos ?? defaults.combos,
      appointments: parsed.appointments ?? defaults.appointments,
      workingDays: parsed.workingDays ?? defaults.workingDays,
      slotDuration: parsed.slotDuration ?? defaults.slotDuration,
      adminPassword: parsed.adminPassword ?? defaults.adminPassword,
      whatsapp: parsed.whatsapp ?? defaults.whatsapp,
      originCep: parsed.originCep ?? defaults.originCep,
      originLat: parsed.originLat ?? defaults.originLat,
      originLon: parsed.originLon ?? defaults.originLon,
      originAddress: parsed.originAddress ?? defaults.originAddress,
    };

    // Migração: se versão antiga, força as coordenadas corretas do código
    if (!parsed.storeVersion || parsed.storeVersion < STORE_VERSION) {
      data.originLat = defaults.originLat;
      data.originLon = defaults.originLon;
      data.originAddress = defaults.originAddress;
      data.originCep = defaults.originCep;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    return data;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: StoreData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Services ──────────────────────────────────────────────
export function getServices(): Service[] { return getData().services; }
export function getActiveServices(): Service[] { return getData().services.filter(s => s.active); }
export function saveServices(services: Service[]): void { saveData({ ...getData(), services }); }

// ── Combos ────────────────────────────────────────────────
export function getCombos(): Combo[] { return getData().combos; }
export function getActiveCombos(): Combo[] { return getData().combos.filter(c => c.active); }
export function saveCombos(combos: Combo[]): void { saveData({ ...getData(), combos }); }

// ── Appointments ──────────────────────────────────────────
export function getAppointments(): Appointment[] { return getData().appointments; }

export function saveAppointment(appointment: Appointment): void {
  const data = getData();
  const idx = data.appointments.findIndex(a => a.id === appointment.id);
  if (idx >= 0) data.appointments[idx] = appointment;
  else data.appointments.push(appointment);
  saveData(data);
}

export function updateAppointmentStatus(id: string, status: Appointment['status']): void {
  const data = getData();
  const idx = data.appointments.findIndex(a => a.id === id);
  if (idx >= 0) { data.appointments[idx].status = status; saveData(data); }
}

export function deleteAppointment(id: string): void {
  const data = getData();
  data.appointments = data.appointments.filter(a => a.id !== id);
  saveData(data);
}

// ── Working days ──────────────────────────────────────────
export function getWorkingDays(): WorkingDay[] { return getData().workingDays; }
export function saveWorkingDays(workingDays: WorkingDay[]): void { saveData({ ...getData(), workingDays }); }

export function getAvailableSlots(date: string): string[] {
  const data = getData();
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const workingDay = data.workingDays.find(wd => wd.dayOfWeek === dayOfWeek);
  if (!workingDay?.open) return [];

  const slots: string[] = [];
  const [startH, startM] = workingDay.startTime.split(':').map(Number);
  const [endH, endM] = workingDay.endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + data.slotDuration <= end) {
    slots.push(`${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`);
    current += data.slotDuration;
  }

  const booked = data.appointments.filter(a => a.date === date && a.status !== 'cancelled').map(a => a.time);
  return slots.filter(s => !booked.includes(s));
}

// ── Origin (ponto de partida) ─────────────────────────────
export interface OriginData { cep: string; lat: number; lon: number; address: string; }
export function getOrigin(): OriginData {
  const d = getData();
  return { cep: d.originCep, lat: d.originLat, lon: d.originLon, address: d.originAddress };
}
export function saveOrigin(o: OriginData): void {
  saveData({ ...getData(), originCep: o.cep, originLat: o.lat, originLon: o.lon, originAddress: o.address });
}

// ── Auth ──────────────────────────────────────────────────
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('admin_logged_in') === 'true';
}
export function adminLogin(password: string): boolean {
  if (password === getData().adminPassword) { sessionStorage.setItem('admin_logged_in', 'true'); return true; }
  return false;
}
export function adminLogout(): void { sessionStorage.removeItem('admin_logged_in'); }

// ── Utils ─────────────────────────────────────────────────
export function generateId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export function notifyOwnerWhatsApp(appointment: Appointment): void {
  const { whatsapp } = getData();
  const msg =
    `🌸 *Novo Agendamento — Nail Sosuka* 🌸\n\n` +
    `👤 *Cliente:* ${appointment.clientName}\n` +
    `📱 *WhatsApp:* ${appointment.clientPhone}\n` +
    `💅 *Serviço:* ${appointment.serviceName}\n` +
    `💰 *Valor:* ${formatCurrency(appointment.servicePrice)}\n` +
    `📅 *Data:* ${formatDate(appointment.date)}\n` +
    `🕐 *Horário:* ${appointment.time}\n` +
    (appointment.notes ? `📝 *Obs:* ${appointment.notes}\n` : '') +
    `\nConfirme o agendamento respondendo esta mensagem. ✅`;
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}
