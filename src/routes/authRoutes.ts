import { Router } from 'express';
import {
  startRegister,
  verifyEmail,
  login,
} from '../controllers/authController';

const router = Router();

// Registro de novo usuário + envio de código por e-mail
router.post('/register', startRegister);

// Verificação de código enviado para o e-mail
router.post('/verify', verifyEmail);

// Login apenas se usuário estiver verificado
router.post('/login', login);

export default router;
