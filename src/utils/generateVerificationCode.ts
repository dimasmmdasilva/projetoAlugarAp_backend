// Gera e retorna um código de verificação de 6 dígitos aleatórios
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
