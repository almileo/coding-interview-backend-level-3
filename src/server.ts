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

  await initializeDatabase();

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*']
      },
      validate: {
        failAction: async (request, h, err: any) => {
          if (err.isJoi && Array.isArray(err.details)) {
            const errors = err.details.map((detail: any) => {
              const path = detail.path || [];
              const field = path[0] || 'unknown';

              let message = detail.message || 'Invalid input';

              if (field === 'price') {
                if (message.includes('required')) {
                  message = 'Field "price" is required';
                } else if (message.includes('positive')) {
                  message = 'Field "price" cannot be negative';
                }
              }

              return { field, message };
            });

            return h.response({ errors }).code(400).takeover();
          }

          if (process.env.NODE_ENV === 'production') {
            return h.response({
              errors: [{ field: 'unknown', message: 'Invalid input data' }]
            }).code(400).takeover();
          } else {
            console.warn('Error details:', err);
            return h.response({
              errors: [{ field: 'unknown', message: err.message || 'Validation error' }]
            }).code(400).takeover();
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

  await server.register(itemRoutes(itemService));

  server.route([
    {
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
    },
    {
      method: 'GET',
      path: '/',
      options: {
        description: 'Root endpoint',
        notes: 'Returns a simple welcome message',
        tags: ['api', 'root'],
        plugins: {
          'hapi-swagger': {
            responses: {
              '200': {
                description: 'Welcome message',
                schema: Joi.object({
                  message: Joi.string().default('Welcome to the API')
                }).label('RootResponse')
              }
            }
          }
        }
      },
      handler: () => {
        return { message: 'Welcome to the API' };
      }
    }
  ]);

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