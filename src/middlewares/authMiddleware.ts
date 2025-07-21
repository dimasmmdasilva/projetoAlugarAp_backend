import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/authPayload';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Verifica se o header de autorização existe e começa com 'Bearer'
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  // Extrai o token do header
  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token usando a chave secreta
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthPayload;

    // Anexa os dados do usuário ao request
    req.user = decoded;

    // Continua para a próxima função
    next();
  } catch (error) {
    // Retorna erro se o token for inválido ou expirado
    res.status(401).json({ message: 'Token inválido ou expirado' });
    return;
  }
}
