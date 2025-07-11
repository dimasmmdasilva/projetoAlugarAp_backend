import { Router } from 'express';
import {
  listarTodosUsuarios,
  deletarUsuario,
  deletarImovel,
} from '../controllers/adminController';

import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Middleware: só usuários ADMIN podem acessar essas rotas
const adminOnly = [authMiddleware, roleMiddleware(Role.ADMIN)];

// [GET] /admin/users → Listar todos os usuários
router.get('/users', ...adminOnly, asyncHandler(listarTodosUsuarios));

// [DELETE] /admin/users/:id → Excluir um usuário e seus imóveis
router.delete('/users/:id', ...adminOnly, asyncHandler(deletarUsuario));

// [DELETE] /admin/properties/:id → Excluir um imóvel específico
router.delete('/properties/:id', ...adminOnly, asyncHandler(deletarImovel));

export default router;
