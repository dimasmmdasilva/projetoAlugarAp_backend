import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { generateVerificationCode } from '../utils/generateVerificationCode';
import { sendVerificationEmail } from '../services/emailService';

// [GET] /users/me → Obter perfil do usuário autenticado
export async function obterPerfil(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    logger.warn('Tentativa de acesso ao perfil sem autenticação');
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const perfil = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    logger.info(`Perfil carregado para o usuário ID ${user.id}`);
    return res.status(200).json(perfil);
  } catch (error) {
    logger.error(`Erro ao obter perfil do usuário ID ${user.id}: ${error}`);
    return res.status(500).json({ message: 'Erro ao obter perfil.' });
  }
}

// [PUT] /users/me → Atualizar nome ou e-mail (com revalidação se mudar e-mail)
export async function atualizarPerfil(req: Request, res: Response) {
  const user = req.user;
  const { name, email } = req.body;

  if (!user) {
    logger.warn('Tentativa de atualização de perfil sem autenticação');
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const usuarioAtual = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!usuarioAtual) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const atualizaEmail = email && email !== usuarioAtual.email;

    const updateData: any = { name };

    if (atualizaEmail) {
      const emailExistente = await prisma.user.findUnique({ where: { email } });

      if (emailExistente) {
        return res.status(400).json({ message: 'E-mail já está em uso.' });
      }

      const verificationCode = generateVerificationCode();

      updateData.email = email;
      updateData.isVerified = false;
      updateData.verificationCode = verificationCode;

      await sendVerificationEmail(email, verificationCode);
      logger.info(`E-mail alterado para ${email}. Novo código enviado.`);
    }

    const atualizado = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    logger.info(`Perfil atualizado para o usuário ID ${user.id}`);
    return res.status(200).json({
      message: atualizaEmail
        ? 'Perfil atualizado. Confirme o novo e-mail.'
        : 'Perfil atualizado com sucesso.',
      user: atualizado,
    });
  } catch (error) {
    logger.error(`Erro ao atualizar perfil do usuário ID ${user.id}: ${error}`);
    return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
}

// [PUT] /users/password → Atualizar senha
export async function atualizarSenha(req: Request, res: Response) {
  const user = req.user;
  const { senhaAtual, novaSenha } = req.body;

  if (!user) {
    logger.warn('Tentativa de troca de senha sem autenticação');
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const usuario = await prisma.user.findUnique({ where: { id: user.id } });

    if (!usuario || !(await bcrypt.compare(senhaAtual, usuario.password))) {
      logger.warn(`Senha atual incorreta para o usuário ID ${user.id}`);
      return res.status(400).json({ message: 'Senha atual incorreta.' });
    }

    const novaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: novaHash },
    });

    logger.info(`Senha atualizada com sucesso para o usuário ID ${user.id}`);
    return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    logger.error(`Erro ao atualizar senha do usuário ID ${user.id}: ${error}`);
    return res.status(500).json({ message: 'Erro ao atualizar senha.' });
  }
}
