import { Router } from 'express';
import {
  startRegister,
  verifyEmail,
  login,
} from '../controllers/authController';

const router = Router();

// [POST] /auth/register → Registro de novo usuário com código de verificação por e-mail
router.post('/register', startRegister);

// [POST] /auth/verify → Verificação do código enviado por e-mail
router.post('/verify', verifyEmail);

// [POST] /auth/login → Login apenas para usuários já verificados
router.post('/login', login);

export default router;
