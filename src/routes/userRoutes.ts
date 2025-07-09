import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/admin-only',
  authMiddleware,
  roleMiddleware(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Acesso autorizado para ADMIN' });
  }
);

router.get(
  '/owner-only',
  authMiddleware,
  roleMiddleware(Role.OWNER),
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Acesso autorizado para OWNER' });
  }
);

router.get(
  '/renter-only',
  authMiddleware,
  roleMiddleware(Role.RENTER),
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Acesso autorizado para RENTER' });
  }
);

export default router;
