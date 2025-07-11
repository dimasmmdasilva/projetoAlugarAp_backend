import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';

// [POST] /bookings → Criar nova reserva
export async function criarReserva(req: Request, res: Response) {
  const { propertyId, startDate, endDate } = req.body;
  const user = req.user;

  if (!user || user.role !== 'RENTER') {
    logger.warn('Tentativa de reserva sem permissão de locatário.');
    return res
      .status(403)
      .json({ message: 'Apenas locatários podem reservar imóveis.' });
  }

  if (!propertyId || !startDate || !endDate) {
    logger.warn(`Reserva com dados incompletos pelo usuário ${user.id}`);
    return res.status(400).json({ message: 'Dados obrigatórios ausentes.' });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      logger.warn(
        `Usuário ${user.id} tentou reservar imóvel inexistente ID ${propertyId}`
      );
      return res.status(404).json({ message: 'Imóvel não encontrado.' });
    }

    if (!property.available) {
      logger.warn(
        `Usuário ${user.id} tentou reservar imóvel indisponível ID ${propertyId}`
      );
      return res
        .status(400)
        .json({ message: 'Imóvel indisponível para reserva.' });
    }

    const conflito = await prisma.booking.findFirst({
      where: {
        propertyId,
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (conflito) {
      logger.warn(
        `Conflito de datas na reserva do imóvel ${propertyId} pelo usuário ${user.id}`
      );
      return res
        .status(400)
        .json({ message: 'Imóvel já reservado para essas datas.' });
    }

    const reserva = await prisma.booking.create({
      data: {
        userId: user.id,
        propertyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    logger.info(`Reserva criada: usuário ${user.id} → imóvel ${propertyId}`);
    return res.status(201).json(reserva);
  } catch (error) {
    logger.error(
      `Erro ao criar reserva para usuário ${user.id}: ${String(error)}`
    );
    return res.status(500).json({ message: 'Erro ao criar reserva.' });
  }
}

// [GET] /bookings/me → Minhas reservas
export async function listarMinhasReservas(req: Request, res: Response) {
  const user = req.user;

  if (!user || user.role !== 'RENTER') {
    logger.warn('Acesso não autorizado às próprias reservas.');
    return res
      .status(403)
      .json({ message: 'Apenas locatários podem acessar suas reservas.' });
  }

  try {
    const reservas = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: { id: true, title: true, location: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    logger.info(`Usuário ${user.id} listou suas reservas.`);
    return res.status(200).json(reservas);
  } catch (error) {
    logger.error(
      `Erro ao buscar reservas do usuário ${user.id}: ${String(error)}`
    );
    return res.status(500).json({ message: 'Erro ao buscar reservas.' });
  }
}

// [GET] /bookings/property/:id → Reservas de um imóvel (visível apenas para o OWNER)
export async function listarReservasDoImovel(req: Request, res: Response) {
  const user = req.user;
  const propertyId = Number(req.params.id);

  if (!user || user.role !== 'OWNER') {
    logger.warn(
      `Acesso negado: usuário ${user?.id} tentou acessar reservas de imóvel como não-OWNER`
    );
    return res.status(403).json({
      message: 'Apenas proprietários podem ver reservas dos seus imóveis.',
    });
  }

  try {
    const propriedade = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!propriedade || propriedade.ownerId !== user.id) {
      logger.warn(
        `Usuário ${user.id} tentou acessar reservas de imóvel não pertencente: ${propertyId}`
      );
      return res
        .status(403)
        .json({ message: 'Você não tem acesso a este imóvel.' });
    }

    const reservas = await prisma.booking.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    logger.info(
      `Proprietário ${user.id} listou reservas do imóvel ${propertyId}`
    );
    return res.status(200).json(reservas);
  } catch (error) {
    logger.error(
      `Erro ao buscar reservas do imóvel ${propertyId}: ${String(error)}`
    );
    return res
      .status(500)
      .json({ message: 'Erro ao buscar reservas do imóvel.' });
  }
}
