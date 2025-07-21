import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { sendVerificationEmail } from '../services/emailService';
import { generateVerificationCode } from '../utils/generateVerificationCode';

// [POST] /auth/register → Cadastro com envio de código de verificação
export async function startRegister(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    role,
    cpf,
    rg,
    telefone,
    endereco,
    numero,
    complemento,
    cep,
  } = req.body;

  // Verifica campos obrigatórios
  if (
    !name ||
    !email ||
    !password ||
    !cpf ||
    !rg ||
    !telefone ||
    !endereco ||
    !numero ||
    !cep
  ) {
    logger.warn('Tentativa de registro com campos ausentes');
    res
      .status(400)
      .json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    return;
  }

  try {
    // Verifica se o e-mail já está cadastrado
    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      logger.warn(`Registro falhou: e-mail já cadastrado (${email})`);
      res.status(400).json({ message: 'E-mail já cadastrado.' });
      return;
    }

    // Gera hash da senha e código de verificação
    const hash = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    // Cria novo usuário no banco
    await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role,
        cpf,
        rg,
        telefone,
        endereco,
        numero,
        complemento,
        cep,
        isVerified: false,
        verificationCode,
      },
    });

    // Envia o código por e-mail
    await sendVerificationEmail(email, verificationCode);

    logger.info(`Usuário registrado. Código enviado para ${email}`);
    res
      .status(201)
      .json({ message: 'Código enviado para o e-mail informado.' });
  } catch (error) {
    logger.error(`Erro no registro do usuário (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
}

// [POST] /auth/verify → Verifica o código de confirmação enviado por e-mail
export async function verifyEmail(req: Request, res: Response) {
  const { email, code } = req.body;

  if (!email || !code) {
    logger.warn('Verificação falhou: dados incompletos');
    res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
    return;
  }

  try {
    // Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn(`Verificação falhou: usuário não encontrado (${email})`);
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    if (user.isVerified) {
      logger.info(`Usuário já verificado: ${email}`);
      res.status(400).json({ message: 'Usuário já está verificado.' });
      return;
    }

    if (user.verificationCode !== code) {
      logger.warn(`Código incorreto para o e-mail: ${email}`);
      res.status(400).json({ message: 'Código de verificação inválido.' });
      return;
    }

    // Atualiza status de verificado
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
      },
    });

    logger.info(`Verificação concluída com sucesso para: ${email}`);
    res.status(200).json({ message: 'Verificação concluída com sucesso.' });
  } catch (error) {
    logger.error(`Erro na verificação do usuário (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao verificar e-mail.' });
  }
}

// [POST] /auth/login → Login com verificação de e-mail e geração de token
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login falhou: e-mail ou senha ausentes');
    res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    return;
  }

  try {
    // Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn(`Login falhou: usuário não encontrado (${email})`);
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      logger.warn(`Login falhou: senha incorreta (${email})`);
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // Verifica se conta está verificada
    if (!user.isVerified) {
      logger.warn(`Login bloqueado: conta não verificada (${email})`);
      res
        .status(403)
        .json({ message: 'Conta não verificada. Verifique seu e-mail.' });
      return;
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    logger.info(`Login efetuado com sucesso para: ${email}`);
    res.status(200).json({ token });
  } catch (error) {
    logger.error(`Erro durante o login (${email}): ${error}`);
    res.status(500).json({ message: 'Erro ao realizar login.' });
  }
}
