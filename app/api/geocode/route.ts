import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ORS_API_KEY not set' }, { status: 500 });

  try {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(text)}&boundary.country=BRA&size=1`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json({ error: `ORS geocode error ${res.status}` }, { status: 502 });

    const data = await res.json() as {
      features?: Array<{ geometry: { coordinates: [number, number] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords) return NextResponse.json({ error: 'No result' }, { status: 404 });

    const [lon, lat] = coords;
    return NextResponse.json({ lat, lon });
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 502 });
  }
}
