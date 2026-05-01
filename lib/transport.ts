'use client';

import { getOrigin, getTransportPricePerBand } from './store';

const FREE_RADIUS_KM = 0.5; // 500 m grátis
const BAND_KM = 0.5;         // faixa de 500 m

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

export function calcTransportCost(distanceKm: number, pricePerBand?: number): number {
  if (distanceKm <= FREE_RADIUS_KM) return 0;
  const bands = Math.ceil((distanceKm - FREE_RADIUS_KM) / BAND_KM);
  return bands * (pricePerBand ?? getTransportPricePerBand());
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

// ORS Geocode — server-side via /api/geocode (usa API key, sem CORS, alta precisão)
async function geocodeWithOrs(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const data = await fetchJson(
      `/api/geocode?text=${encodeURIComponent(query)}`,
    ) as { lat?: number; lon?: number; error?: string };
    if (data.lat && data.lon) return { lat: data.lat, lon: data.lon };
  } catch { /* ignora */ }
  return null;
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

  // ── 1. BrasilAPI v2 — obtém endereço ─────────────────────
  try {
    const br = await fetchJson(`https://brasilapi.com.br/api/cep/v2/${clean}`) as {
      city?: string;
      state?: string;
      neighborhood?: string;
      street?: string;
      location?: { coordinates?: { latitude?: number; longitude?: number } };
    };

    if (br?.city) {
      const address = [br.street, br.neighborhood, br.city].filter(Boolean).join(', ');
      const city = `${br.city}/${br.state}`;

      // BrasilAPI às vezes retorna coords precisas em location.coordinates
      const bLat = br.location?.coordinates?.latitude;
      const bLon = br.location?.coordinates?.longitude;
      if (bLat && bLon) return { lat: bLat, lon: bLon, address, city, cep: clean };

      // Sem coords — geocodifica via ORS (server-side, alta precisão)
      const fullQuery = [br.street, br.neighborhood, br.city, br.state, clean, 'Brasil'].filter(Boolean).join(', ');
      const coords = await geocodeWithOrs(fullQuery) ?? await geocodeWithOrs(`${br.city}, ${br.state}, Brasil`);
      if (coords) return { ...coords, address, city, cep: clean };

      return null;
    }
  } catch { /* cai no fallback */ }

  // ── 2. Fallback: ViaCEP + Photon ─────────────────────────
  try {
    const via = await fetchJson(`https://viacep.com.br/ws/${clean}/json/`) as Record<string, string>;
    if (!via || via.erro) return null;

    const address = [via.logradouro, via.bairro, via.localidade].filter(Boolean).join(', ');
    const city = `${via.localidade}/${via.uf}`;

    const fullQuery = [via.logradouro, via.bairro, via.localidade, via.uf, clean, 'Brasil'].filter(Boolean).join(', ');
    const coords =
      await geocodeWithOrs(fullQuery) ??
      await geocodeWithOrs(`${via.localidade}, ${via.uf}, Brasil`);

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

async function orsDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): Promise<number | null> {
  try {
    const data = await fetchJson(
      `/api/route-distance?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`,
      10000,
    ) as { distanceKm?: number; error?: string };
    if (data.distanceKm) return data.distanceKm;
  } catch { /* ignora */ }
  return null;
}

export async function calcTransportFromCep(clientCep: string): Promise<TransportResult | null> {
  const destination = await lookupCep(clientCep);
  if (!destination) return null;

  const origin = getOrigin();

  const distanceKm =
    (await orsDistanceKm(origin.lat, origin.lon, destination.lat, destination.lon)) ??
    haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);

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
