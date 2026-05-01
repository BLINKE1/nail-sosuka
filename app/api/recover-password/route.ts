import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Serviço de e-mail não configurado.' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'Nail Sosuka <onboarding@resend.dev>',
    to: email,
    subject: 'Recuperação de Senha — Nail Sosuka',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#D4789C;margin-bottom:8px">Nail Sosuka</h2>
        <p style="color:#333">Você solicitou a recuperação de senha do painel administrativo.</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
          <p style="margin:0;font-size:13px;color:#666">Sua senha atual é:</p>
          <p style="margin:8px 0 0;font-size:24px;font-weight:bold;color:#A0587C;letter-spacing:2px">${password}</p>
        </div>
        <p style="color:#666;font-size:13px">Após acessar o painel, recomendamos trocar a senha em <strong>Configurações</strong>.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Se não foi você que solicitou, ignore este e-mail.</p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error: 'Falha ao enviar e-mail.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
