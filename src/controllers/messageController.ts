import { Request, Response } from 'express';
import prisma from '../config/prisma';

// [POST] /messages → Enviar mensagem
export async function enviarMensagem(req: Request, res: Response) {
  const { receiverId, content } = req.body;
  const sender = req.user;

  if (!sender) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
  }

  try {
    const mensagem = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId,
      },
    });

    return res.status(201).json(mensagem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao enviar mensagem.' });
  }
}

// [GET] /messages/received → Ver mensagens recebidas
export async function listarMensagensRecebidas(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
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

    return res.status(200).json(mensagens);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar mensagens.' });
  }
}

// [GET] /messages/sent → Ver mensagens enviadas
export async function listarMensagensEnviadas(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
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

    return res.status(200).json(mensagens);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Erro ao buscar mensagens enviadas.' });
  }
}
