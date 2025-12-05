import { hashToken } from '../utils/hash';
import { NotFoundError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';
import crypto from 'crypto';
import { clients, getAllClients, findClientById } from '../db/memory-store';
import { v4 as uuidv4 } from 'uuid';

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
  private generateClientToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async registerClient(data: ClientData) {
    const existing = Array.from(clients.values()).find((c) => c.name === data.name);

    if (existing) {
      throw new ConflictError('Client with this name already exists');
    }

    const token = this.generateClientToken();
    const tokenHash = await hashToken(token);
    const clientId = uuidv4();

    const client = {
      id: clientId,
      name: data.name,
      tokenHash,
      hostname: data.hostname || null,
      ipAddress: data.ipAddress || null,
      osType: data.osType || null,
      osVersion: data.osVersion || null,
      agentVersion: data.agentVersion || null,
      thresholdCpu: data.thresholdCpu || 85,
      thresholdMemory: data.thresholdMemory || 85,
      thresholdDisk: data.thresholdDisk || 90,
      metadata: data.metadata || {},
      isActive: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };

    clients.set(clientId, client);

    logger.info({ clientId, name: client.name }, 'Client registered');

    return {
      client: {
        id: client.id,
        name: client.name,
        hostname: client.hostname,
        ipAddress: client.ipAddress,
        osType: client.osType,
        osVersion: client.osVersion,
        agentVersion: client.agentVersion,
        thresholdCpu: client.thresholdCpu,
        thresholdMemory: client.thresholdMemory,
        thresholdDisk: client.thresholdDisk,
        isActive: client.isActive,
        createdAt: client.createdAt,
      },
      token,
    };
  }

  async getAllClients(includeInactive = false) {
    let result = getAllClients();

    if (!includeInactive) {
      result = result.filter((c) => c.isActive);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClientById(id: string) {
    const client = findClientById(id);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  async updateClient(id: string, data: Partial<ClientData>) {
    const client = findClientById(id);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    Object.assign(client, {
      ...data,
      updatedAt: new Date(),
    });

    logger.info({ clientId: id }, 'Client updated');

    return client;
  }

  async deleteClient(id: string) {
    const client = findClientById(id);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    clients.delete(id);

    logger.info({ clientId: id }, 'Client deleted');
  }

  async deactivateClient(id: string) {
    const client = findClientById(id);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    client.isActive = false;

    logger.info({ clientId: id }, 'Client deactivated');
  }

  async regenerateToken(id: string) {
    const client = findClientById(id);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const token = this.generateClientToken();
    const tokenHash = await hashToken(token);

    client.tokenHash = tokenHash;

    logger.info({ clientId: id }, 'Client token regenerated');

    return { token };
  }

  async getClientStats() {
    const allClients = getAllClients();
    const active = allClients.filter((c) => c.isActive);
    const recentlyActive = active.filter((c) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return c.lastSeen && c.lastSeen > fiveMinutesAgo;
    });

    return {
      total: allClients.length,
      active: active.length,
      inactive: allClients.length - active.length,
      recentlyActive: recentlyActive.length,
    };
  }
}

export default new ClientsService();
