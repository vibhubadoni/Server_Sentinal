import { Queue, Worker, Job } from 'bullmq';
import redis from '../db/redis';
import prisma from '../db/client';
import logger from '../utils/logger';
import config from '../config';
import { getWebSocketServer } from '../sockets';
import { notificationsSentTotal, notificationDeliveryDuration } from '../utils/prometheus';

interface NotificationJob {
  alertId: string;
  userId?: string;
  channels: ('websocket' | 'fcm' | 'email')[];
  priority?: number;
}

// Create notification queue
export const notificationQueue = new Queue<NotificationJob>('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: config.notificationRetryAttempts,
    backoff: {
      type: 'exponential',
      delay: config.notificationRetryDelay,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

/**
 * Process notification jobs
 */
const notificationWorker = new Worker<NotificationJob>(
  'notifications',
  async (job: Job<NotificationJob>) => {
    const { alertId, userId, channels } = job.data;
    const startTime = Date.now();

    logger.info({ jobId: job.id, alertId, userId, channels }, 'Processing notification job');

    try {
      // Fetch alert details
      const alert = await prisma.alert.findUnique({
        where: { id: alertId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!alert) {
        logger.warn({ alertId }, 'Alert not found for notification');
        return;
      }

      // Determine recipients
      const recipients = userId
        ? [userId]
        : await getAlertRecipients(alert.clientId, alert.severity);

      // Send notifications through each channel
      for (const channel of channels) {
        for (const recipientId of recipients) {
          try {
            const channelStartTime = Date.now();

            switch (channel) {
              case 'websocket':
                await sendWebSocketNotification(recipientId, alert);
                break;
              case 'fcm':
                await sendFCMNotification(recipientId, alert);
                break;
              case 'email':
                await sendEmailNotification(recipientId, alert);
                break;
            }

            // Record successful delivery
            await prisma.notificationDelivery.create({
              data: {
                alertId,
                userId: recipientId,
                channel,
                status: 'delivered',
                sentAt: new Date(),
                deliveredAt: new Date(),
              },
            });

            const channelDuration = (Date.now() - channelStartTime) / 1000;
            notificationDeliveryDuration.observe({ channel }, channelDuration);
            notificationsSentTotal.inc({ channel, status: 'success' });

            logger.debug(
              { alertId, userId: recipientId, channel },
              'Notification delivered successfully'
            );
          } catch (error) {
            logger.error(
              { error, alertId, userId: recipientId, channel },
              'Failed to deliver notification'
            );

            // Record failed delivery
            await prisma.notificationDelivery.create({
              data: {
                alertId,
                userId: recipientId,
                channel,
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                sentAt: new Date(),
              },
            });

            notificationsSentTotal.inc({ channel, status: 'failed' });
          }
        }
      }

      const totalDuration = (Date.now() - startTime) / 1000;
      logger.info(
        { jobId: job.id, alertId, duration: totalDuration },
        'Notification job completed'
      );
    } catch (error) {
      logger.error({ error, jobId: job.id, alertId }, 'Notification job failed');
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: config.workerConcurrency,
  }
);

/**
 * Get recipients for an alert based on client and severity
 */
async function getAlertRecipients(clientId: string, severity: string): Promise<string[]> {
  // Get all active users with appropriate roles
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: severity === 'CRITICAL' ? ['superadmin', 'admin', 'operator'] : ['superadmin', 'admin'],
      },
    },
    select: {
      id: true,
    },
  });

  return users.map((u) => u.id);
}

/**
 * Send WebSocket notification
 */
async function sendWebSocketNotification(userId: string, alert: any): Promise<void> {
  try {
    const wsServer = getWebSocketServer();
    wsServer.sendAlertUpdate(alert.id, alert, [userId]);
  } catch (error) {
    logger.error({ error, userId, alertId: alert.id }, 'WebSocket notification failed');
    throw error;
  }
}

/**
 * Send FCM push notification
 */
async function sendFCMNotification(userId: string, alert: any): Promise<void> {
  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  if (subscriptions.length === 0) {
    logger.debug({ userId }, 'No active push subscriptions found');
    return;
  }

  // TODO: Implement FCM push using firebase-admin SDK
  // For now, log the intent
  logger.info(
    { userId, alertId: alert.id, subscriptionCount: subscriptions.length },
    'FCM notification would be sent here'
  );

  // Example FCM payload structure:
  // const message = {
  //   notification: {
  //     title: alert.title,
  //     body: alert.message,
  //   },
  //   data: {
  //     alertId: alert.id,
  //     clientId: alert.clientId,
  //     severity: alert.severity,
  //   },
  //   tokens: subscriptions.map(s => s.endpoint),
  // };
}

/**
 * Send email notification
 */
async function sendEmailNotification(userId: string, alert: any): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // TODO: Implement email sending using nodemailer or similar
  logger.info(
    { userId, email: user.email, alertId: alert.id },
    'Email notification would be sent here'
  );

  // Example email structure:
  // const emailContent = {
  //   to: user.email,
  //   subject: `[${alert.severity}] ${alert.title}`,
  //   html: `
  //     <h2>${alert.title}</h2>
  //     <p>${alert.message}</p>
  //     <p><strong>Client:</strong> ${alert.client.name}</p>
  //     <p><strong>Severity:</strong> ${alert.severity}</p>
  //     <p><strong>Time:</strong> ${alert.createdAt}</p>
  //   `,
  // };
}

// Worker event handlers
notificationWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'Notification job completed');
});

notificationWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Notification job failed');
});

notificationWorker.on('error', (error) => {
  logger.error({ error }, 'Notification worker error');
});

export { notificationWorker };

/**
 * Enqueue a notification job
 */
export async function enqueueNotification(data: NotificationJob): Promise<void> {
  await notificationQueue.add('send-notification', data, {
    priority: data.priority || 1,
  });

  logger.debug({ alertId: data.alertId }, 'Notification job enqueued');
}

export default notificationQueue;
