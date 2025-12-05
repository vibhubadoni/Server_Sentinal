import prisma from '../db/client';
import { hashToken } from '../utils/hash';
import { NotFoundError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';
import crypto from 'crypto';

export interface ClientData {
  name: string;
  hostname?: string;
  ipAddress?: string;
  osType?: string;
  osVersion?: string;
  agentVersion?: string;
  thresholdCpu?: number;
  thresholdMemory?: number;
  thresholdDisk?: number;
  metadata?: Record<string, any>;
}

export class ClientsService {
  /**
   * Generate a secure client token
   */
  private generateClientToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register a new client
   */
  async registerClient(data: ClientData) {
    // Check if client with same name exists
    const existing = await prisma.client.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Client with this name already exists');
    }

    // Generate token
    const token = this.generateClientToken();
    const tokenHash = await hashToken(token);

    // Create client
    const client = await prisma.client.create({
      data: {
        name: data.name,
        tokenHash,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        osType: data.osType,
        osVersion: data.osVersion,
        agentVersion: data.agentVersion,
        thresholdCpu: data.thresholdCpu,
        thresholdMemory: data.thresholdMemory,
        thresholdDisk: data.thresholdDisk,
        metadata: data.metadata || {},
      },
      select: {
        id: true,
        name: true,
        hostname: true,
        ipAddress: true,
        osType: true,
        osVersion: true,
        agentVersion: true,
        thresholdCpu: true,
        thresholdMemory: true,
        thresholdDisk: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info({ clientId: client.id, name: client.name }, 'Client registered');

    return {
      client,
      token, // Return plain token only once
    };
  }

  /**
   * Get all clients
   */
  async getAllClients(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        hostname: true,
        ipAddress: true,
        osType: true,
        osVersion: true,
        agentVersion: true,
        thresholdCpu: true,
        thresholdMemory: true,
        thresholdDisk: true,
        isActive: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        hostname: true,
        ipAddress: true,
        osType: true,
        osVersion: true,
        agentVersion: true,
        metadata: true,
        thresholdCpu: true,
        thresholdMemory: true,
        thresholdDisk: true,
        isActive: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: Partial<ClientData>) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.hostname && { hostname: data.hostname }),
        ...(data.ipAddress && { ipAddress: data.ipAddress }),
        ...(data.osType && { osType: data.osType }),
        ...(data.osVersion && { osVersion: data.osVersion }),
        ...(data.agentVersion && { agentVersion: data.agentVersion }),
        ...(data.thresholdCpu !== undefined && { thresholdCpu: data.thresholdCpu }),
        ...(data.thresholdMemory !== undefined && { thresholdMemory: data.thresholdMemory }),
        ...(data.thresholdDisk !== undefined && { thresholdDisk: data.thresholdDisk }),
        ...(data.metadata && { metadata: data.metadata }),
      },
    });

    logger.info({ clientId: id }, 'Client updated');

    return updated;
  }

  /**
   * Delete client
   */
  async deleteClient(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.delete({
      where: { id },
    });

    logger.info({ clientId: id }, 'Client deleted');
  }

  /**
   * Deactivate client
   */
  async deactivateClient(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ clientId: id }, 'Client deactivated');
  }

  /**
   * Regenerate client token
   */
  async regenerateToken(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const token = this.generateClientToken();
    const tokenHash = await hashToken(token);

    await prisma.client.update({
      where: { id },
      data: { tokenHash },
    });

    logger.info({ clientId: id }, 'Client token regenerated');

    return { token };
  }

  /**
   * Get client statistics
   */
  async getClientStats() {
    const [total, active, inactive, recentlyActive] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({ where: { isActive: false } }),
      prisma.client.count({
        where: {
          isActive: true,
          lastSeen: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      recentlyActive,
    };
  }
}

export default new ClientsService();
