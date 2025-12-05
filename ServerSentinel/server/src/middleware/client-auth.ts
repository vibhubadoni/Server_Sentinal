import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { asyncHandler } from '../utils/async-handler';
import prisma from '../db/client';
import { compareToken } from '../utils/hash';

declare global {
  namespace Express {
    interface Request {
      clientId?: string;
    }
  }
}

/**
 * Middleware to authenticate agent/client requests using client tokens
 */
export const authenticateClient = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const clientToken = req.headers['x-client-token'] as string;

    if (!clientToken) {
      throw new UnauthorizedError('Client token required');
    }

    // Extract client ID from request (could be in params, body, or query)
    const clientId = req.params.clientId || req.body.clientId || req.query.clientId;

    if (!clientId) {
      throw new UnauthorizedError('Client ID required');
    }

    // Verify client exists and token matches
    const client = await prisma.client.findUnique({
      where: { id: clientId as string },
      select: { id: true, tokenHash: true, isActive: true },
    });

    if (!client) {
      throw new UnauthorizedError('Invalid client');
    }

    if (!client.isActive) {
      throw new UnauthorizedError('Client is inactive');
    }

    const isValidToken = await compareToken(clientToken, client.tokenHash);

    if (!isValidToken) {
      throw new UnauthorizedError('Invalid client token');
    }

    req.clientId = client.id;
    next();
  }
);
