import { Request, Response, NextFunction } from 'express';

// Define o tipo de função assíncrona que pode ser tratada
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Função que envolve um handler assíncrono e trata erros automaticamente
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Garante que erros assíncronos sejam passados ao Express
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
