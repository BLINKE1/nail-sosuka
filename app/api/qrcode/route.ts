import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') ?? 'localhost:3000';
  const protocol = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const url = `${protocol}://${host}/cartao`;

  const buffer = await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#D4789C',
      light: '#12101C',
    },
  });

  const png = new Uint8Array(buffer);

  return new NextResponse(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline; filename="qrcode-nail-sosuka.png"',
    },
  });
}
