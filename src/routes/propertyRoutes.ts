import { Router } from 'express';
import {
  createProperty,
  listAvailableProperties,
  listMyProperties,
} from '../controllers/propertyController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// [POST] /properties – Criar novo imóvel (somente OWNER)
router.post('/', authMiddleware, roleMiddleware(Role.OWNER), createProperty);

// [GET] /properties – Listar todos os imóveis disponíveis (público)
router.get('/', listAvailableProperties);

// [GET] /properties/me – Listar imóveis do usuário logado (somente OWNER)
router.get('/me', authMiddleware, roleMiddleware(Role.OWNER), listMyProperties);

export default router;
