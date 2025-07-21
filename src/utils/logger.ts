import { createLogger, format, transports } from 'winston';

// Cria instância do logger com configuração personalizada
const logger = createLogger({
  level: 'info', // nível mínimo de log: info, warn, error, etc.
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // adiciona data e hora
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`; // formato do log
    })
  ),
  transports: [
    new transports.Console(), // exibe no console
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // salva erros
    new transports.File({ filename: 'logs/combined.log' }), // salva todos os logs
  ],
});

export default logger;
