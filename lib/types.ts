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

export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;        // preço final do combo (pode ter desconto)
  duration: number;     // duração total em minutos
  serviceIds: string[]; // IDs dos serviços incluídos
  active: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;    // IDs separados por vírgula, ou "combo:ID"
  serviceName: string;  // nome(s) exibido(s)
  servicePrice: number; // total
  serviceDuration: number; // duração total em minutos
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
}

export interface WorkingDay {
  dayOfWeek: number;
  label: string;
  open: boolean;
  startTime: string;
  endTime: string;
}

export interface StoreData {
  storeVersion: number;
  services: Service[];
  combos: Combo[];
  appointments: Appointment[];
  workingDays: WorkingDay[];
  slotDuration: number;
  adminPassword: string;
  whatsapp: string;
  originCep: string;
  originLat: number;
  originLon: number;
  originAddress: string;
  transportPricePerBand: number;
  recoveryEmail: string;
}
