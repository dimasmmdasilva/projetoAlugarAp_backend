import { Resend } from 'resend';
import logger from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, code: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Código de verificação',
      text: `Seu código de verificação é: ${code}`,
    });

    logger.info(`Código de verificação enviado para: ${to}`);
  } catch (error) {
    logger.error(`Erro ao enviar código de verificação para ${to}: ${error}`);
    throw new Error('Erro ao enviar e-mail de verificação.');
  }
}
