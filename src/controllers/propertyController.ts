import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';

// [POST] /properties – Criar imóvel (somente OWNER)
export async function createProperty(
  req: Request,
  res: Response
): Promise<void> {
  const { title, description, price, location } = req.body;
  const user = req.user;

  if (!user) {
    logger.warn('Tentativa de criação de imóvel sem autenticação');
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  if (user.role !== 'OWNER') {
    logger.warn(`Usuário ID ${user.id} tentou criar imóvel sem permissão`);
    res
      .status(403)
      .json({ message: 'Apenas proprietários podem cadastrar imóveis.' });
    return;
  }

  if (!title || !description || !price || !location) {
    logger.warn(
      `Campos obrigatórios ausentes na criação de imóvel pelo usuário ID ${user.id}`
    );
    res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    return;
  }

  try {
    const property = await prisma.property.create({
      data: {
        title,
        description,
        price,
        location,
        ownerId: user.id,
      },
    });

    logger.info(`Imóvel criado com sucesso pelo usuário ID ${user.id}`);
    res.status(201).json(property);
  } catch (error) {
    logger.error(`Erro ao criar imóvel pelo usuário ID ${user.id}: ${error}`);
    res.status(500).json({ message: 'Erro ao criar imóvel.' });
  }
}

// [GET] /properties – Listar imóveis disponíveis (público)
export async function listAvailableProperties(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const properties = await prisma.property.findMany({
      where: { available: true },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info('Lista de imóveis disponíveis carregada');
    res.status(200).json(properties);
  } catch (error) {
    logger.error(`Erro ao buscar imóveis disponíveis: ${error}`);
    res.status(500).json({ message: 'Erro ao buscar imóveis.' });
  }
}

// [GET] /properties/me – Listar imóveis do OWNER autenticado
export async function listMyProperties(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.user;

  if (!user) {
    logger.warn('Tentativa de acesso aos imóveis sem autenticação');
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  if (user.role !== 'OWNER') {
    logger.warn(
      `Usuário ID ${user.id} tentou acessar imóveis que não são dele`
    );
    res
      .status(403)
      .json({ message: 'Acesso permitido apenas a proprietários.' });
    return;
  }

  try {
    const myProperties = await prisma.property.findMany({
      where: { ownerId: user.id },
    });

    logger.info(`Imóveis listados para o proprietário ID ${user.id}`);
    res.status(200).json(myProperties);
  } catch (error) {
    logger.error(
      `Erro ao buscar imóveis do proprietário ID ${user.id}: ${error}`
    );
    res.status(500).json({ message: 'Erro ao buscar seus imóveis.' });
  }
}
