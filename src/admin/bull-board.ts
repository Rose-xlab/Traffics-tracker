import { createBullBoard as createBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Express } from 'express';
import { createLogger } from '../utils/logger';
import { 
  productSyncQueue, 
  tariffSyncQueue, 
  updateSyncQueue, 
  cleanupQueue 
} from '../queue/job-queues';

const logger = createLogger('bull-board');

/**
 * Create Bull Board UI for job monitoring
 */
export function createBullBoard(app: Express): void {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  try {
    logger.info('Setting up Bull Board admin UI');
    
    // Create Express adapter
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    
    // Create Bull Board with all queues
    createBoard({
      queues: [
        new BullAdapter(productSyncQueue),
        new BullAdapter(tariffSyncQueue),
        new BullAdapter(updateSyncQueue),
        new BullAdapter(cleanupQueue)
      ],
      serverAdapter
    });
    
    // Basic auth middleware for admin routes
    const basicAuth = (req: any, res: any, next: any) => {
      // Get API key from request
      const apiKey = req.headers['x-api-key'] || '';
      
      // Check if API key is valid
      if (apiKey !== process.env.API_KEY) {
        res.status(401).send('Unauthorized');
        return;
      }
      
      next();
    };
    
    // Mount Bull Board UI with authentication
    app.use('/admin/queues', basicAuth, serverAdapter.getRouter());
    
    logger.info('Bull Board admin UI mounted at /admin/queues');
  } catch (error) {
    logger.error('Failed to setup Bull Board admin UI', error);
  }
}