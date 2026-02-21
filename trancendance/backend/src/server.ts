import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import analyticsRoutes from './routes/analyticsRoutes';
import dataExportRoutes from './routes/dataExportRoutes';
import gdprRoutes from './routes/gdprRoutes';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/gdpr', gdprRoutes);

// Socket.io connection for real-time updates
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe-dashboard', () => {
    console.log(`Client ${socket.id} subscribed to dashboard`);
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Export io instance for use in other modules
export const getIO = () => io;

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  }
);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
