import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../services/emailService';
import { generateVerificationCode } from '../utils/generateVerificationCode';
import logger from '../utils/logger';

// [POST] /auth/register → Registro + envio de código por e-mail
export async function startRegister(
  req: Request,
  res: Response
): Promise<void> {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    logger.warn('Tentativa de registro com campos obrigatórios ausentes');
    res.status(400).json({ message: 'Campos obrigatórios' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn(`Registro bloqueado: e-mail já cadastrado (${email})`);
      res.status(400).json({ message: 'E-mail já cadastrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    await prisma.user.create({
      data: { name, email, password: hashedPassword, verificationCode },
    });

    await sendVerificationEmail(email, verificationCode);
    logger.info(`Novo usuário registrado e código enviado: ${email}`);

    res
      .status(201)
      .json({ message: 'Código enviado para o e-mail informado.' });
  } catch (error) {
    logger.error(`Erro no registro de usuário (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
}

// [POST] /auth/verify → Verificação de código enviado por e-mail
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body;

  if (!email || !code) {
    logger.warn('Verificação falhou: e-mail ou código ausente');
    res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn(`Verificação falhou: usuário não encontrado (${email})`);
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    if (user.isVerified) {
      logger.info(`Usuário já verificado anteriormente: ${email}`);
      res.status(400).json({ message: 'Usuário já está verificado.' });
      return;
    }

    if (user.verificationCode !== code) {
      logger.warn(`Código de verificação incorreto para: ${email}`);
      res.status(400).json({ message: 'Código de verificação inválido.' });
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
      },
    });

    logger.info(`Verificação de e-mail concluída com sucesso: ${email}`);
    res.status(200).json({ message: 'Verificação concluída com sucesso.' });
  } catch (error) {
    logger.error(`Erro na verificação de e-mail (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao verificar e-mail.' });
  }
}

// [POST] /auth/login → Login com verificação de e-mail e JWT
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Tentativa de login com dados incompletos');
    res.status(400).json({ message: 'E-mail e senha obrigatórios.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn(`Login falhou: usuário não encontrado (${email})`);
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn(`Login falhou: senha incorreta para ${email}`);
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    if (!user.isVerified) {
      logger.warn(`Login bloqueado: e-mail não verificado (${email})`);
      res
        .status(403)
        .json({ message: 'Conta não verificada. Verifique seu e-mail.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    logger.info(`Login efetuado com sucesso para: ${email}`);
    res.status(200).json({ token });
  } catch (error) {
    logger.error(`Erro no login do usuário (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao realizar login.' });
  }
}
