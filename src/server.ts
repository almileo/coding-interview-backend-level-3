import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { itemRoutes } from './routes/itemRoutes';
import { ItemRepository } from './repositories/itemRepository';
import { ItemService } from './services/itemService';
import { initializeDatabase } from './config/database';
import { registerSwagger } from './config/swagger';
import { registerRateLimiter } from './config/rateLimiter';
import 'dotenv/config';

export const initializeServer = async (): Promise<Hapi.Server> => {
  // Initialize database connection
  await initializeDatabase();

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'] // For development - restrict in production
      },
      validate: {
        failAction: async (request, h, err) => {
          if (process.env.NODE_ENV === 'production') {
            // Production: Don't leak error details
            throw new Error('Invalid request payload');
          } else {
            // Development: Log and respond with error details
            console.error(err);
            throw err;
          }
        }
      }
    }
  });

  await registerSwagger(server);

  // Only use rate limiting in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    await registerRateLimiter(server);
  }

  const itemRepository = new ItemRepository();
  const itemService = new ItemService(itemRepository);

  // Register routes
  await server.register(itemRoutes(itemService));

  // Ping route to check server health
  server.route({
    method: 'GET',
    path: '/ping',
    options: {
      description: 'Health check endpoint',
      notes: 'Returns a simple response to verify the server is running',
      tags: ['api', 'health'],
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Server is healthy',
              schema: Joi.object({
                ok: Joi.boolean().default(true)
              }).label('HealthResponse')
            }
          }
        }
      }
    },
    handler: () => {
      return { ok: true };
    }
  });

  return server;
};

export const startServer = async (): Promise<Hapi.Server> => {
  const server = await initializeServer();
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
  console.log(`API documentation available at ${server.info.uri}/api-docs`);
  return server;
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});