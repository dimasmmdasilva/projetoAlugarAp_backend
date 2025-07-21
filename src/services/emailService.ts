import { Resend } from 'resend';
import logger from '../utils/logger';

// Inicializa o cliente Resend com a chave da API
const resend = new Resend(process.env.RESEND_API_KEY);

// Envia e-mail com o código de verificação
export async function sendVerificationEmail(to: string, code: string) {
  try {
    // Envia o e-mail com assunto e corpo do código
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Código de verificação',
      text: `Seu código de verificação é: ${code}`,
    });

    // Registra sucesso no envio
    logger.info(`Código de verificação enviado para: ${to}`);
  } catch (error) {
    // Registra erro e relança exceção genérica
    logger.error(`Erro ao enviar código de verificação para ${to}: ${error}`);
    throw new Error('Erro ao enviar e-mail de verificação.');
  }
}
