import * as Hapi from '@hapi/hapi';
import * as HapiSwagger from 'hapi-swagger';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';

export const swaggerOptions: HapiSwagger.RegisterOptions = {
  info: {
    title: 'Coding Interview Leonardo Almiron - CRUD API Documentation',
    version: '1.0.0',
    description: 'API for managing items with CRUD operations',
    contact: {
      name: 'El Dorado Tech Team',
      email: 'tech@eldorado.com'
    }
  },
  grouping: 'tags',
  sortEndpoints: 'ordered',
  tags: [
    {
      name: 'items',
      description: 'Item operations'
    },
    {
      name: 'health',
      description: 'Health check endpoints'
    }
  ],
  documentationPath: '/api-docs',
  securityDefinitions: {
    'api_key': {
      'type': 'apiKey',
      'name': 'Authorization',
      'in': 'header'
    }
  }
};

export const swaggerPlugin = {
  plugin: HapiSwagger,
  options: swaggerOptions
};

export const registerSwagger = async (server: Hapi.Server): Promise<void> => {
  await server.register([
    Inert,
    Vision,
    swaggerPlugin
  ]);
};