import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verifica se há um usuário no request e se o role é permitido
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role as Role)) {
      // Retorna erro se o usuário não tiver permissão
      res.status(403).json({ message: 'Acesso não autorizado' });
      return;
    }

    // Permissão concedida, continua para a próxima função
    next();
  };
}
