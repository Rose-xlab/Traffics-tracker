// express-backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import logger, { createLogger } from './utils/logger';
import { healthCheck, closeConnections } from './utils/database';
// import { startAllJobs, stopAllJobs, closeJobQueues } from './queue/job-queues';
// import { initializeJobProcessors, scheduleRecurringJobs } from './queue/job-queues';
import { initializeMetrics, getMetrics } from './monitoring/metrics-manager';
import { metricsMiddleware } from './monitoring/metrics-middleware';
import { sendAlert } from './monitoring/alerting-service';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import config from './config';
import apiRoutes from './routes/api';
import syncRoutes from './routes/sync';
import statusRoutes from './routes/status';
import { createBullBoard } from './admin/bull-board';

const loga = createLogger('server',logger);
const app = express();
const port = config.server.port;

// Request ID middleware - add unique ID to each request
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {

  const _uuid = uuidv4();
  res.setHeader('X-Request-ID',_uuid);
  next();
});

// Standard middleware
app.use(cors());
app.use(json());

// Metrics middleware
app.use(metricsMiddleware());

// Logging middleware
app.use((req:any, res, next) => {
  loga.info(`${req.method} ${req.path}`, { requestId: req.id });
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await healthCheck();
    const circuitStatus = getCircuitStatus();
    
    res.status(dbStatus && circuitStatus.allHealthy ? 200 : 503).json({
      status: dbStatus && circuitStatus.allHealthy ? 'ok' : 'degraded',
      components: {
        database: dbStatus ? 'ok' : 'error',
        circuits: circuitStatus
      },
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env,
      name:"frank"
    });
  } catch (error) {
    loga.error('Health check failed', error as Error);
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    loga.error('Error generating metrics', error as Error);
    res.status(500).send('Error generating metrics');
  }
});

// API Routes
app.use('/api', apiRoutes);
app.use('/sync', syncRoutes);
app.use('/status', statusRoutes);

// Add Bull Board admin UI for job monitoring
createBullBoard(app);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Get status of circuit breakers
function getCircuitStatus() {
  // In a real implementation, you would import the circuit breaker registry
  // and check the status of each breaker
  
  // For now, return a placeholder
  return {
    allHealthy: true,
    breakers: {
      'usitc-api': 'closed',
      'ustr-api': 'closed',
      'cbp-api': 'closed',
      'federal-register-api': 'closed'
    }
  };
}

// Initialize metrics before starting server
initializeMetrics();

// Initialize job processors
// initializeJobProcessors();

// Start server
const server = app.listen(port, () => {
  loga.info(`Tariffs data service running on port ${port}`);
  
  // Schedule recurring jobs
  // scheduleRecurringJobs();
  
  // Send startup alert
  sendAlert({
    severity: 'info',
    title: 'Service Started',
    message: `Tariffs Data Service started successfully on ${new Date().toISOString()}`,
    component: 'server'
  });
});

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  
  sendAlert({
    severity: 'critical',
    title: 'Uncaught Exception',
    message: error.message,
    component: 'server',
    details: {
      stack: error.stack
    }
  });
  
  // Exit after a short delay to allow logging
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  loga.error('Unhandled rejection', reason as Error);
  
  sendAlert({
    severity: 'critical',
    title: 'Unhandled Promise Rejection',
    message: reason instanceof Error ? reason.message : String(reason),
    component: 'server',
    details: {
      stack: reason instanceof Error ? reason.stack : undefined
    }
  });
});

async function gracefulShutdown() {
  loga.info('Shutting down gracefully...');
  
  // Send shutdown alert
  await sendAlert({
    severity: 'info',
    title: 'Service Shutting Down',
    message: 'Tariffs Data Service is shutting down gracefully',
    component: 'server'
  });
  
  // Stop scheduled jobs and close queues
  // stopAllJobs();
  // await closeJobQueues();
  
  // Close database connections
  await closeConnections();
  
  // Close server
  server.close(() => {
    loga.info('Server shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if still hanging
  setTimeout(() => {
    loga.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

export default app;
