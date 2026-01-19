import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config, validateConfig } from './config';
import deepgramRouter from './routes/deepgram';
import { initializeSocketIO } from './socket/interviewerSocketHandler';

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
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`✅ Frontend URL: ${config.frontendUrl}`);
      console.log(`✅ Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
