import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(to: string, code: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: 'Código de verificação',
    text: `Seu código de verificação é: ${code}`
  })
}
