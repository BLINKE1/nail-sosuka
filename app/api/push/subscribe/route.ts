import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

const SUBSCRIPTIONS_KEY = 'push_subscriptions';

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 });
    }

    let subs: PushSubscriptionJSON[] = [];
    try {
      subs = (await kv.get<PushSubscriptionJSON[]>(SUBSCRIPTIONS_KEY)) ?? [];
    } catch {
      subs = [];
    }

    const exists = subs.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      await kv.set(SUBSCRIPTIONS_KEY, subs);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 });

    let subs: PushSubscriptionJSON[] = [];
    try {
      subs = (await kv.get<PushSubscriptionJSON[]>(SUBSCRIPTIONS_KEY)) ?? [];
    } catch {
      subs = [];
    }

    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    await kv.set(SUBSCRIPTIONS_KEY, filtered);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
