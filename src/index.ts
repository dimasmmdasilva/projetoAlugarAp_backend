import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';

// Carrega variáveis do .env
dotenv.config();

// Importa rotas organizadas por domínio
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import messageRoutes from './routes/messageRoutes';
import bookingRoutes from './routes/bookingRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota de status
app.get('/', (req: Request, res: Response) => {
  res.send('API rodando com sucesso!');
});

// Rotas da aplicação
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/properties', propertyRoutes);
app.use('/messages', messageRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);

// Rota não encontrada
app.use((req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
