import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
import { Role } from '@prisma/client';
import {
  obterPerfil,
  atualizarPerfil,
  atualizarSenha,
} from '../controllers/userController';

const router = Router();

// Testes de acesso por papel de usuário
router.get(
  '/admin-only',
  authMiddleware,
  roleMiddleware(Role.ADMIN),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para ADMIN' });
  })
);

router.get(
  '/owner-only',
  authMiddleware,
  roleMiddleware(Role.OWNER),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para OWNER' });
  })
);

router.get(
  '/renter-only',
  authMiddleware,
  roleMiddleware(Role.RENTER),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para RENTER' });
  })
);

// Endpoints de perfil do usuário autenticado
router.get('/me', authMiddleware, asyncHandler(obterPerfil)); // Ver perfil
router.put('/me', authMiddleware, asyncHandler(atualizarPerfil)); // Atualizar nome ou e-mail
router.put('/password', authMiddleware, asyncHandler(atualizarSenha)); // Atualizar senha

export default router;
