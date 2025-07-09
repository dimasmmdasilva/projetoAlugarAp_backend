import { Router } from 'express';
import {
  enviarMensagem,
  listarMensagensRecebidas,
  listarMensagensEnviadas,
} from '../controllers/messageController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// [POST] /messages → Enviar nova mensagem
router.post('/', authMiddleware, asyncHandler(enviarMensagem));

// [GET] /messages/received → Listar mensagens recebidas pelo usuário autenticado
router.get('/received', authMiddleware, asyncHandler(listarMensagensRecebidas));

// [GET] /messages/sent → Listar mensagens enviadas pelo usuário autenticado
router.get('/sent', authMiddleware, asyncHandler(listarMensagensEnviadas));

export default router;
