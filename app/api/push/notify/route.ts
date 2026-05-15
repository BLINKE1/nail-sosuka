import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const SUBSCRIPTIONS_KEY = 'push_subscriptions';

function initVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error('VAPID keys not configured');
  webpush.setVapidDetails('mailto:contato@nailsosuka.com', pub, priv);
}

export async function POST(req: NextRequest) {
  try {
    initVapid();
  } catch {
    return NextResponse.json({ error: 'Push não configurado: adicione VAPID keys na Vercel' }, { status: 503 });
  }

  try {
    const payload = await req.json();

    let subs: PushSubscriptionJSON[] = [];
    try {
      subs = (await kv.get<PushSubscriptionJSON[]>(SUBSCRIPTIONS_KEY)) ?? [];
    } catch {
      subs = [];
    }

    if (subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(sub as Parameters<typeof webpush.sendNotification>[0], JSON.stringify(payload))
      )
    );

    // Remove subscriptions that returned 410 Gone (unsubscribed)
    const invalid = new Set<string>();
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number };
        if (err?.statusCode === 410) invalid.add(subs[i].endpoint!);
      }
    });

    if (invalid.size > 0) {
      const cleaned = subs.filter((s) => !invalid.has(s.endpoint!));
      await kv.set(SUBSCRIPTIONS_KEY, cleaned);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
