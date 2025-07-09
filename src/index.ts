import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega variáveis do arquivo .env antes de qualquer outra coisa
dotenv.config();

// Importa rotas organizadas por domínio da aplicação
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import messageRoutes from './routes/messageRoutes';

const app = express();

// Middlewares globais
app.use(cors()); // Permite requisições de origens diferentes (útil para frontend separado)
app.use(express.json()); // Habilita o express a entender JSON no corpo das requisições

// Rota de status da API
app.get('/', (req: Request, res: Response) => {
  res.send('API rodando com sucesso!');
});

// Rotas organizadas por contexto
app.use('/auth', authRoutes); // Registro, verificação de e-mail e login
app.use('/users', userRoutes); // Funcionalidades específicas por tipo de usuário
app.use('/properties', propertyRoutes); // Cadastro e listagem de imóveis (público e proprietário)
app.use('/messages', messageRoutes); // Sistema de mensagens privadas

// Tratamento para rotas inexistentes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
