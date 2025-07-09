import { Request, Response } from 'express';
import prisma from '../config/prisma';

// [POST] /properties – Criar imóvel (somente OWNER)
export async function createProperty(
  req: Request,
  res: Response
): Promise<void> {
  const { title, description, price, location } = req.body;

  if (!title || !description || !price || !location) {
    res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    return;
  }

  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  if (user.role !== 'OWNER') {
    res
      .status(403)
      .json({ message: 'Apenas proprietários podem cadastrar imóveis.' });
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

    res.status(201).json(property);
  } catch (error) {
    console.error(error);
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

    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
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
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  if (user.role !== 'OWNER') {
    res
      .status(403)
      .json({ message: 'Acesso permitido apenas a proprietários.' });
    return;
  }

  try {
    const myProperties = await prisma.property.findMany({
      where: { ownerId: user.id },
    });

    res.status(200).json(myProperties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar seus imóveis.' });
  }
}
