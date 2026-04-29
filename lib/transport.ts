'use client';

const PRICE_PER_KM = 5;
const FREE_RADIUS_KM = 1;

// Coordenadas fixas do ponto de partida (CEP 18208-340, Jardim Alvorada, Itapetininga/SP)
const ORIGIN: { lat: number; lon: number } = { lat: -23.5886, lon: -48.0483 };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcTransportCost(distanceKm: number): number {
  if (distanceKm <= FREE_RADIUS_KM) return 0;
  return Math.round((distanceKm - FREE_RADIUS_KM) * PRICE_PER_KM * 100) / 100;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface GeoCoords { lat: number; lon: number; address: string; city: string; }

async function geocodeCep(cep: string): Promise<GeoCoords | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  const via = await fetchJson(`https://viacep.com.br/ws/${clean}/json/`) as Record<string, string>;
  if (!via || via.erro) return null;

  const address = [via.logradouro, via.bairro, via.localidade].filter(Boolean).join(', ');
  const city = `${via.localidade}/${via.uf}`;

  const query = [via.logradouro, via.bairro, via.localidade, via.uf, 'Brasil']
    .filter(Boolean)
    .join(', ');

  const nom = await fetchJson(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  ) as Array<{ lat: string; lon: string }>;

  if (!Array.isArray(nom) || !nom.length) return null;

  return { lat: parseFloat(nom[0].lat), lon: parseFloat(nom[0].lon), address, city };
}

export interface TransportResult {
  distanceKm: number;
  cost: number;
  address: string;
  city: string;
  free: boolean;
}

export async function calcTransportFromCep(clientCep: string): Promise<TransportResult | null> {
  const destination = await geocodeCep(clientCep);
  if (!destination) return null;

  const distanceKm = haversineKm(ORIGIN.lat, ORIGIN.lon, destination.lat, destination.lon);
  const cost = calcTransportCost(distanceKm);

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    cost,
    address: destination.address,
    city: destination.city,
    free: cost === 0,
  };
}

// Política de sinal
export const SIGNAL_PERCENT = 30;
export const CANCELLATION_REFUND_PERCENT = 50;
export const CANCELLATION_HOURS = 72;

export function calcSignal(servicePrice: number): number {
  return Math.round(servicePrice * (SIGNAL_PERCENT / 100) * 100) / 100;
}
