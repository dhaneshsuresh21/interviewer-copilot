// Must be first import — intercepts console.log/warn/error and tees to file
import { logRouter } from './utils/fileLogger';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config, validateConfig } from './config';
import deepgramRouter from './routes/deepgram';
import sessionsRouter from './routes/sessions';
import templatesRouter from './routes/templates';
import authRouter from './routes/auth';
import logsRouter from './routes/logs';
import candidatesRouter from './routes/candidates';
import resumeRouter from './routes/resume';
import { initializeSocketIO } from './socket/interviewerSocketHandler';
import { logger } from './utils/logger';

async function startServer() {
  try {
    validateConfig();

    const app = express();
    const httpServer = createServer(app);

    app.use(cors({
      origin: config.frontendUrl,
      credentials: true,
    }));

    app.use(express.json());

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api', deepgramRouter);
    app.use('/api', sessionsRouter);
    app.use('/api', templatesRouter);
    app.use('/api', authRouter);
    app.use('/api', logsRouter);
    app.use('/api', candidatesRouter);
    app.use('/api', resumeRouter);
    app.use('/api', logRouter);

    const io = new Server(httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    initializeSocketIO(io);

    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown handler
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      try {
        const { prismaStorageService } = await import('./services/prismaStorageService');
        await prismaStorageService.disconnect();
        const { langchainService } = await import('./services/langchainService');
        langchainService.destroy();
        httpServer.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
