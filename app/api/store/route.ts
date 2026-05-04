import { kv } from '@vercel/kv';
import { StoreData } from '@/lib/types';

const KEY = 'nail_sosuka_store';

export async function GET() {
  try {
    const data = await kv.get<StoreData>(KEY);
    return Response.json(data ?? null);
  } catch {
    return Response.json(null);
  }
}

export async function PUT(req: Request) {
  try {
    const data: StoreData = await req.json();
    await kv.set(KEY, data);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
