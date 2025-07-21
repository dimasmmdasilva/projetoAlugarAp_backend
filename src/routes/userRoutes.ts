import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
import { Role } from '@prisma/client';

import {
  confirmarCodigo,
  obterPerfil,
  atualizarPerfil,
  solicitarTrocaSenha,
} from '../controllers/userController';

const router = Router();

// [POST] /users/verify → Confirmar código de verificação
router.post('/verify', authMiddleware, asyncHandler(confirmarCodigo));

// [GET] /users/me → Obter perfil do usuário autenticado
router.get('/me', authMiddleware, asyncHandler(obterPerfil));

// [PUT] /users/me → Atualizar dados do usuário com verificação por e-mail
router.put('/me', authMiddleware, asyncHandler(atualizarPerfil));

// [PUT] /users/password → Solicitar troca de senha com verificação
router.put('/password', authMiddleware, asyncHandler(solicitarTrocaSenha));

// [GET] /users/admin-only → Acesso restrito a usuários com papel ADMIN
router.get(
  '/admin-only',
  authMiddleware,
  roleMiddleware(Role.ADMIN),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para ADMIN' });
  })
);

// [GET] /users/owner-only → Acesso restrito a usuários com papel OWNER
router.get(
  '/owner-only',
  authMiddleware,
  roleMiddleware(Role.OWNER),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para OWNER' });
  })
);

// [GET] /users/renter-only → Acesso restrito a usuários com papel RENTER
router.get(
  '/renter-only',
  authMiddleware,
  roleMiddleware(Role.RENTER),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Acesso autorizado para RENTER' });
  })
);

export default router;
