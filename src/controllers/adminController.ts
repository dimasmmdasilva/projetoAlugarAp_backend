import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';

// [GET] /admin/users → Listar todos os usuários
export async function listarTodosUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Admin listou todos os usuários do sistema.');
    return res.status(200).json(usuarios);
  } catch (error) {
    logger.error(`Erro ao listar usuários: ${error}`);
    return res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
}

// [DELETE] /admin/users/:id → Excluir usuário e seus dados relacionados
export async function deletarUsuario(req: Request, res: Response) {
  const { id } = req.params;
  const userId = Number(id);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      logger.warn(`Tentativa de excluir usuário inexistente: ID ${userId}`);
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await prisma.$transaction(async (tx) => {
      if (user.role === 'OWNER') {
        await tx.property.deleteMany({ where: { ownerId: userId } });
        logger.info(`Imóveis do proprietário ID ${userId} excluídos.`);
      }

      await tx.message.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      await tx.booking.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    logger.info(
      `Usuário ID ${userId} e seus dados relacionados foram excluídos.`
    );
    return res
      .status(200)
      .json({ message: 'Usuário e dados relacionados excluídos com sucesso.' });
  } catch (error) {
    logger.error(`Erro ao excluir usuário ID ${userId}: ${error}`);
    return res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
}

// [DELETE] /admin/properties/:id → Excluir imóvel específico
export async function deletarImovel(req: Request, res: Response) {
  const { id } = req.params;
  const propertyId = Number(id);

  try {
    await prisma.booking.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } });

    logger.info(
      `Imóvel ID ${propertyId} e suas reservas foram excluídos pelo administrador.`
    );
    return res.status(204).send();
  } catch (error) {
    logger.error(`Erro ao excluir imóvel ID ${propertyId}: ${error}`);
    return res.status(500).json({ message: 'Erro ao excluir imóvel.' });
  }
}
