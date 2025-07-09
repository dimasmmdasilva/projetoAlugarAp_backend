import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role as Role)) {
      res.status(403).json({ message: 'Acesso não autorizado' });
      return;
    }

    next();
  };
}
