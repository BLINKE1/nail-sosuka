'use client';

import { getOrigin } from './store';

const FREE_RADIUS_KM = 0.5;   // 500 m grátis
const BAND_KM = 0.1;           // faixa de 100 m
const PRICE_PER_BAND = 2.0;    // R$ 2,00 por faixa cheia

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
  const bands = Math.ceil((distanceKm - FREE_RADIUS_KM) / BAND_KM);
  return bands * PRICE_PER_BAND;
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

// Photon (komoot/OpenStreetMap) — precisão de rua, CORS ok, sem rate limit rígido
async function geocodeWithPhoton(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const data = await fetchJson(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=pt`
    ) as { features?: Array<{ geometry: { coordinates: [number, number] } }> };

    if (data.features?.length) {
      const [lon, lat] = data.features[0].geometry.coordinates; // GeoJSON: [lon, lat]
      return { lat, lon };
    }
  } catch { /* ignora */ }
  return null;
}

// Open-Meteo — fallback apenas se Photon falhar (precisão de cidade)
async function geocodeCity(city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const data = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt&format=json`
    ) as { results?: Array<{ latitude: number; longitude: number; country_code: string; admin1?: string }> };

    if (!data.results?.length) return null;

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

      // Sem coords — geocodifica endereço completo via Photon (nível de rua)
      const fullQuery = [br.street, br.neighborhood, br.city, br.state, 'Brasil'].filter(Boolean).join(', ');
      const coords = await geocodeWithPhoton(fullQuery) ?? await geocodeCity(br.city, br.state ?? '');
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

    const fullQuery = [via.logradouro, via.bairro, via.localidade, via.uf, 'Brasil'].filter(Boolean).join(', ');
    const coords =
      await geocodeWithPhoton(fullQuery) ??
      await geocodeWithPhoton(`${via.localidade}, ${via.uf}, Brasil`) ??
      await geocodeCity(via.localidade, via.uf ?? '');

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
