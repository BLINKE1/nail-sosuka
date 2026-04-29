'use client';

import { getOrigin } from './store';

const PRICE_PER_KM = 5;
const FREE_RADIUS_KM = 1;

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

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
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

// Geocodifica cidade pelo nome usando Open-Meteo (gratuito, sem rate limit, CORS ok)
async function geocodeCity(city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const data = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt&format=json`
    ) as { results?: Array<{ latitude: number; longitude: number; country_code: string; admin1?: string }> };

    if (!data.results?.length) return null;

    // Prefere resultado no Brasil e no estado correto
    const match =
      data.results.find(r => r.country_code === 'BR' && r.admin1?.toLowerCase().includes(state.toLowerCase())) ??
      data.results.find(r => r.country_code === 'BR') ??
      data.results[0];

    return { lat: match.latitude, lon: match.longitude };
  } catch {
    return null;
  }
}

export interface CepLookupResult {
  lat: number;
  lon: number;
  address: string;
  city: string;
  cep: string;
}

export async function lookupCep(cep: string): Promise<CepLookupResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  // ── 1. BrasilAPI v2 ──────────────────────────────────────
  try {
    const br = await fetchJson(`https://brasilapi.com.br/api/cep/v2/${clean}`) as {
      city?: string;
      state?: string;
      neighborhood?: string;
      street?: string;
      location?: {
        type?: string;
        coordinates?: { latitude?: number; longitude?: number };
      };
    };

    if (br?.city) {
      const address = [br.street, br.neighborhood, br.city].filter(Boolean).join(', ');
      const city = `${br.city}/${br.state}`;

      // BrasilAPI retorna coordenadas em location.coordinates
      const lat = br.location?.coordinates?.latitude;
      const lon = br.location?.coordinates?.longitude;
      if (lat && lon) {
        return { lat, lon, address, city, cep: clean };
      }

      // Sem coordenadas — geocodifica pela cidade via Open-Meteo
      const coords = await geocodeCity(br.city, br.state ?? '');
      if (coords) return { ...coords, address, city, cep: clean };

      return null;
    }
  } catch { /* cai no fallback */ }

  // ── 2. Fallback: ViaCEP + Open-Meteo ────────────────────
  try {
    const via = await fetchJson(`https://viacep.com.br/ws/${clean}/json/`) as Record<string, string>;
    if (!via || via.erro) return null;

    const address = [via.logradouro, via.bairro, via.localidade].filter(Boolean).join(', ');
    const city = `${via.localidade}/${via.uf}`;

    const coords = await geocodeCity(via.localidade, via.uf ?? '');
    if (coords) return { ...coords, address, city, cep: clean };
  } catch { /* ignora */ }

  return null;
}

export interface TransportResult {
  distanceKm: number;
  cost: number;
  address: string;
  city: string;
  free: boolean;
}

export async function calcTransportFromCep(clientCep: string): Promise<TransportResult | null> {
  const destination = await lookupCep(clientCep);
  if (!destination) return null;

  const origin = getOrigin();
  const distanceKm = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
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
