import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

type ConfirmationEmailParams = {
  clientName: string;
  clientEmail: string;
  professionalName: string;
  serviceName: string;
  slotStartTime: string;
  managementToken: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export async function sendConfirmationEmail(params: ConfirmationEmailParams) {
  const manageUrl = `${APP_URL}/manage/${params.managementToken}`;
  const formattedDate = formatDate(params.slotStartTime);

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a; padding: 32px 24px;">
      <p style="font-size: 13px; color: #888; margin: 0 0 24px;">Tornu</p>
      <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px;">Turno confirmado ✓</h1>
      <p style="color: #555; margin: 0 0 24px;">Hola ${params.clientName}, tu reserva está lista.</p>
      <div style="background: #f7f5f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Profesional:</strong> ${params.professionalName}</p>
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Servicio:</strong> ${params.serviceName}</p>
        <p style="margin: 0; font-size: 14px;"><strong>Fecha:</strong> ${formattedDate}</p>
      </div>
      <a href="${manageUrl}" style="display: inline-block; background: #1a6b4a; color: white; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; margin-bottom: 28px;">Gestionar mi turno →</a>
      <p style="font-size: 13px; color: #999; margin: 0;">Con ese link podés cancelar tu turno si lo necesitás. No lo compartas con nadie.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;">
      <p style="font-size: 12px; color: #bbb; margin: 0;">Tornu · Hecho en Argentina 🇦🇷</p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Tu turno del ${formattedDate}`,
    html,
  });
}
