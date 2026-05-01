import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat1 = searchParams.get('lat1');
  const lon1 = searchParams.get('lon1');
  const lat2 = searchParams.get('lat2');
  const lon2 = searchParams.get('lon2');

  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ORS_API_KEY not set' }, { status: 500 });
  }

  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${lon1},${lat1}&end=${lon2},${lat2}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json({ error: 'ORS error' }, { status: 502 });

    const data = await res.json() as {
      features?: Array<{ properties?: { summary?: { distance?: number } } }>;
    };
    const distanceM = data.features?.[0]?.properties?.summary?.distance;
    if (!distanceM) return NextResponse.json({ error: 'No route found' }, { status: 404 });

    return NextResponse.json({ distanceKm: distanceM / 1000 });
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 502 });
  }
}
