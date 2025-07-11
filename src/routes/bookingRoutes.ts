import { Router } from 'express';
import {
  criarReserva,
  listarMinhasReservas,
  listarReservasDoImovel,
} from '../controllers/bookingController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
import { Role } from '@prisma/client';

const router = Router();

// [POST] /bookings – Criar reserva (somente RENTER)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(Role.RENTER),
  asyncHandler(criarReserva)
);

// [GET] /bookings/me – Ver minhas reservas (somente RENTER)
router.get(
  '/me',
  authMiddleware,
  roleMiddleware(Role.RENTER),
  asyncHandler(listarMinhasReservas)
);

// [GET] /bookings/property/:id – Ver reservas de um imóvel (somente OWNER)
router.get(
  '/property/:id',
  authMiddleware,
  roleMiddleware(Role.OWNER),
  asyncHandler(listarReservasDoImovel)
);

export default router;
