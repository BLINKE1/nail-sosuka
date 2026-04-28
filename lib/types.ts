export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: 'manicure' | 'alongamento' | 'outros';
  active: boolean;
  emoji: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string; // "2024-01-15"
  time: string; // "09:00"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
}

export interface WorkingDay {
  dayOfWeek: number; // 0=Dom, 6=Sáb
  label: string;
  open: boolean;
  startTime: string;
  endTime: string;
}

export interface StoreData {
  services: Service[];
  appointments: Appointment[];
  workingDays: WorkingDay[];
  slotDuration: number; // minutes
  adminPassword: string;
  whatsapp: string;
}
