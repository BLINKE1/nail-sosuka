'use client';

const ORIGIN_CEP = '18208340';
const PRICE_PER_KM = 5;
const FREE_RADIUS_KM = 1;

// Haversine — retorna distância em km entre dois pontos
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

export interface CepResult {
  lat: number;
  lon: number;
  address: string;
  city: string;
}

async function geocodeCep(cep: string): Promise<CepResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  // 1. Busca endereço no ViaCEP
  const viaRes = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!viaRes.ok) return null;
  const via = await viaRes.json();
  if (via.erro) return null;

  const query = [via.logradouro, via.bairro, via.localidade, via.uf, 'Brasil']
    .filter(Boolean)
    .join(', ');

  // 2. Geocodifica com Nominatim
  const nomRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'NailSosuka/1.0 contact@nailsosuka.com' } }
  );
  if (!nomRes.ok) return null;
  const nom = await nomRes.json();
  if (!nom.length) return null;

  return {
    lat: parseFloat(nom[0].lat),
    lon: parseFloat(nom[0].lon),
    address: [via.logradouro, via.bairro, via.localidade].filter(Boolean).join(', '),
    city: `${via.localidade}/${via.uf}`,
  };
}

let originCoords: { lat: number; lon: number } | null = null;

async function getOriginCoords(): Promise<{ lat: number; lon: number }> {
  if (originCoords) return originCoords;
  const result = await geocodeCep(ORIGIN_CEP);
  if (result) {
    originCoords = { lat: result.lat, lon: result.lon };
    return originCoords;
  }
  // Fallback: coordenadas aproximadas de Botucatu-SP
  return { lat: -22.8855, lon: -48.4439 };
}

export interface TransportResult {
  distanceKm: number;
  cost: number;
  address: string;
  city: string;
  free: boolean;
}

export async function calcTransportFromCep(clientCep: string): Promise<TransportResult | null> {
  const [origin, destination] = await Promise.all([
    getOriginCoords(),
    geocodeCep(clientCep),
  ]);

  if (!destination) return null;

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
