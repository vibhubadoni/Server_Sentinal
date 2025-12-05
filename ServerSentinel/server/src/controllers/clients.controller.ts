import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import clientsService from '../services/clients.service';
import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  hostname: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  osType: z.string().optional(),
  osVersion: z.string().optional(),
  agentVersion: z.string().optional(),
  thresholdCpu: z.number().min(0).max(100).optional(),
  thresholdMemory: z.number().min(0).max(100).optional(),
  thresholdDisk: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});

export class ClientsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const clients = await clientsService.getAllClients(includeInactive);

    res.json({
      success: true,
      data: clients,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await clientsService.getClientById(id);

    res.json({
      success: true,
      data: client,
    });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await clientsService.registerClient(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await clientsService.updateClient(id, req.body);

    res.json({
      success: true,
      data: client,
    });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await clientsService.deleteClient(id);

    res.json({
      success: true,
      data: { message: 'Client deleted successfully' },
    });
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await clientsService.deactivateClient(id);

    res.json({
      success: true,
      data: { message: 'Client deactivated successfully' },
    });
  });

  regenerateToken = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await clientsService.regenerateToken(id);

    res.json({
      success: true,
      data: result,
    });
  });

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await clientsService.getClientStats();

    res.json({
      success: true,
      data: stats,
    });
  });
}

export default new ClientsController();
