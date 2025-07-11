import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';

// [POST] /messages → Enviar mensagem
export async function enviarMensagem(req: Request, res: Response) {
  const { receiverId, content } = req.body;
  const sender = req.user;

  if (!sender) {
    logger.warn('Tentativa de envio de mensagem sem autenticação.');
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  if (!receiverId || !content) {
    logger.warn(
      `Envio de mensagem com campos obrigatórios ausentes por usuário ${sender.id}`
    );
    return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
  }

  if (receiverId === sender.id) {
    logger.warn(`Usuário ${sender.id} tentou enviar mensagem para si mesmo.`);
    return res
      .status(400)
      .json({ message: 'Você não pode enviar mensagem para si mesmo.' });
  }

  try {
    const mensagem = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId,
      },
    });

    logger.info(`Mensagem enviada de ${sender.id} para ${receiverId}`);
    return res.status(201).json(mensagem);
  } catch (error) {
    logger.error(
      `Erro ao enviar mensagem de ${sender.id} para ${receiverId}: ${String(error)}`
    );
    return res.status(500).json({ message: 'Erro ao enviar mensagem.' });
  }
}

// [GET] /messages/received → Ver mensagens recebidas
export async function listarMensagensRecebidas(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    logger.warn(
      'Tentativa de listagem de mensagens recebidas sem autenticação.'
    );
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const mensagens = await prisma.message.findMany({
      where: { receiverId: user.id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`Usuário ${user.id} listou mensagens recebidas.`);
    return res.status(200).json(mensagens);
  } catch (error) {
    logger.error(
      `Erro ao listar mensagens recebidas do usuário ${user.id}: ${String(error)}`
    );
    return res.status(500).json({ message: 'Erro ao buscar mensagens.' });
  }
}

// [GET] /messages/sent → Ver mensagens enviadas
export async function listarMensagensEnviadas(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    logger.warn(
      'Tentativa de listagem de mensagens enviadas sem autenticação.'
    );
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const mensagens = await prisma.message.findMany({
      where: { senderId: user.id },
      include: {
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`Usuário ${user.id} listou mensagens enviadas.`);
    return res.status(200).json(mensagens);
  } catch (error) {
    logger.error(
      `Erro ao listar mensagens enviadas do usuário ${user.id}: ${String(error)}`
    );
    return res
      .status(500)
      .json({ message: 'Erro ao buscar mensagens enviadas.' });
  }
}
