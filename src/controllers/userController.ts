import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { generateVerificationCode } from '../utils/generateVerificationCode';
import { sendVerificationEmail } from '../services/emailService';

// [GET] /users/me → Obter perfil autenticado
export async function obterPerfil(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Não autenticado.' });

  try {
    // Retorna dados do usuário logado
    const perfil = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        cpf: true,
        rg: true,
        telefone: true,
        endereco: true,
        numero: true,
        complemento: true,
        cep: true,
      },
    });

    return res.status(200).json(perfil);
  } catch (error) {
    logger.error('Erro ao obter perfil:', error);
    return res.status(500).json({ message: 'Erro ao obter perfil.' });
  }
}

// [PUT] /users/me → Atualizar dados com nova verificação por e-mail
export async function atualizarPerfil(req: Request, res: Response) {
  const user = req.user;
  const { name, email, telefone, endereco, numero, complemento, cep } =
    req.body;

  if (!user) return res.status(401).json({ message: 'Não autenticado.' });

  try {
    // Busca dados atuais
    const usuario = await prisma.user.findUnique({ where: { id: user.id } });
    if (!usuario)
      return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Verifica se houve mudanças
    const mudou =
      usuario.name !== name ||
      usuario.email !== email ||
      usuario.telefone !== telefone ||
      usuario.endereco !== endereco ||
      usuario.numero !== numero ||
      usuario.complemento !== complemento ||
      usuario.cep !== cep;

    if (!mudou) return res.status(400).json({ message: 'Nada foi alterado.' });

    // Gera código e atualiza dados
    const verificationCode = generateVerificationCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        telefone,
        endereco,
        numero,
        complemento,
        cep,
        isVerified: false,
        verificationCode,
      },
    });

    await sendVerificationEmail(email, verificationCode);

    return res.status(200).json({
      message: 'Dados atualizados. Confirme o código enviado por e-mail.',
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
}

// [PUT] /users/password → Solicita troca de senha com verificação
export async function solicitarTrocaSenha(req: Request, res: Response) {
  const user = req.user;
  const { senhaAtual, novaSenha } = req.body;

  if (!user) return res.status(401).json({ message: 'Não autenticado.' });

  try {
    // Verifica a senha atual
    const usuario = await prisma.user.findUnique({ where: { id: user.id } });
    if (!usuario || !(await bcrypt.compare(senhaAtual, usuario.password))) {
      return res.status(400).json({ message: 'Senha atual incorreta.' });
    }

    // Gera código e armazena senha temporária
    const code = generateVerificationCode();
    const tempHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tempPassword: tempHash,
        isVerified: false,
        verificationCode: code,
      },
    });

    await sendVerificationEmail(usuario.email, code);

    return res.status(200).json({ message: 'Código de verificação enviado.' });
  } catch (error) {
    logger.error('Erro ao solicitar troca de senha:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao solicitar troca de senha.' });
  }
}

// [POST] /users/verify → Confirmar código de verificação
export async function confirmarCodigo(req: Request, res: Response) {
  const user = req.user;
  const { code } = req.body;

  if (!user) return res.status(401).json({ message: 'Não autenticado.' });

  try {
    // Verifica código do usuário
    const usuario = await prisma.user.findUnique({ where: { id: user.id } });
    if (!usuario || usuario.verificationCode !== code) {
      return res.status(400).json({ message: 'Código inválido.' });
    }

    // Prepara dados de atualização
    const updateData: any = {
      isVerified: true,
      verificationCode: null,
    };

    // Aplica nova senha se houver
    if (usuario.tempPassword) {
      updateData.password = usuario.tempPassword;
      updateData.tempPassword = null;
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    return res
      .status(200)
      .json({ message: 'Verificação concluída com sucesso.' });
  } catch (error) {
    logger.error('Erro ao confirmar código:', error);
    return res.status(500).json({ message: 'Erro ao confirmar código.' });
  }
}
