import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendVerificationEmail } from '../services/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// REGISTRO + ENVIO DE CÓDIGO POR E-MAIL
export async function startRegister(
  req: Request,
  res: Response
): Promise<void> {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Campos obrigatórios' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ message: 'E-mail já cadastrado' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await prisma.user.create({
    data: { name, email, password: hashedPassword, verificationCode },
  });

  await sendVerificationEmail(email, verificationCode);

  res.status(201).json({ message: 'Código enviado para o e-mail informado.' });
}

// VERIFICAÇÃO DE CÓDIGO ENVIADO POR E-MAIL
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado.' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: 'Usuário já está verificado.' });
    return;
  }

  if (user.verificationCode !== code) {
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

  res.status(200).json({ message: 'Verificação concluída com sucesso.' });
}

// LOGIN COM VERIFICAÇÃO DE E-MAIL E TOKEN JWT
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'E-mail e senha obrigatórios.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: 'Credenciais inválidas.' });
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    res.status(401).json({ message: 'Credenciais inválidas.' });
    return;
  }

  if (!user.isVerified) {
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

  res.status(200).json({ token });
}
