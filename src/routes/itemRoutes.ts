import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { itemSchemas, idParam } from '../models/validation';
import { ItemService } from '../services/itemService';
import { CreateItemInput, UpdateItemInput } from '../models/item';

export const itemRoutes = (itemService: ItemService): Hapi.Plugin<void> => {
  return {
    name: 'itemRoutes',
    version: '1.0.0',
    register: async (server: Hapi.Server) => {
      server.route({
        method: 'GET',
        path: '/items',
        options: {
          description: 'Get all items',
          notes: 'Returns an array of all available items',
          tags: ['api', 'items'],
          response: {
            schema: itemSchemas.itemList
          },
          plugins: {
            'hapi-swagger': {
              responses: {
                '200': {
                  description: 'Success',
                  schema: itemSchemas.itemList
                },
                '429': {
                  description: 'Too Many Requests'
                }
              }
            }
          }
        },
        handler: async (request, h) => {
          const items = await itemService.getAllItems();
          return h.response(items).code(200);
        }
      });

      server.route({
        method: 'GET',
        path: '/items/{id}',
        options: {
          description: 'Get an item by ID',
          notes: 'Returns a single item by ID',
          tags: ['api', 'items'],
          validate: {
            params: Joi.object({
              id: idParam
            })
          },
          response: {
            schema: itemSchemas.itemResponse
          },
          plugins: {
            'hapi-swagger': {
              responses: {
                '200': {
                  description: 'Success',
                  schema: itemSchemas.itemResponse
                },
                '404': {
                  description: 'Item not found'
                },
                '429': {
                  description: 'Too Many Requests'
                }
              }
            }
          }
        },
        handler: async (request, h) => {
          const id = parseInt(request.params.id, 10);
          const item = await itemService.getItemById(id);
          
          if (!item) {
            return h.response().code(404);
          }
          
          return h.response(item).code(200);
        }
      });

      server.route({
        method: 'POST',
        path: '/items',
        options: {
          description: 'Create a new item',
          notes: 'Creates a new item and returns it with an assigned ID',
          tags: ['api', 'items'],
          validate: {
            payload: itemSchemas.createItem
          },
          response: {
            schema: itemSchemas.itemResponse,
            status: {
              201: itemSchemas.itemResponse,
              400: itemSchemas.error
            }
          },
          plugins: {
            'hapi-swagger': {
              responses: {
                '201': {
                  description: 'Item created successfully',
                  schema: itemSchemas.itemResponse
                },
                '400': {
                  description: 'Bad Request - Invalid input',
                  schema: itemSchemas.error
                },
                '429': {
                  description: 'Too Many Requests'
                }
              },
              payloadType: 'form'
            }
          }
        },
        handler: async (request, h) => {
          const input = request.payload as CreateItemInput;
          
          // Validate input
          const validationErrors = itemService.validateCreateItem(input);
          if (validationErrors.length > 0) {
            console.log('ENTRE a VALIDATION ERRORS');
            return h.response({ errors: validationErrors }).code(400);
          }
          
          const item = await itemService.createItem(input);
          return h.response(item).code(201);
        }
      });

      server.route({
        method: 'PUT',
        path: '/items/{id}',
        options: {
          description: 'Update an existing item',
          notes: 'Updates an item and returns the updated version',
          tags: ['api', 'items'],
          validate: {
            params: Joi.object({
              id: idParam
            }),
            payload: itemSchemas.updateItem
          },
          response: {
            schema: itemSchemas.itemResponse,
            status: {
              200: itemSchemas.itemResponse,
              400: itemSchemas.error,
              404: Joi.any().description('Item not found')
            }
          },
          plugins: {
            'hapi-swagger': {
              responses: {
                '200': {
                  description: 'Item updated successfully',
                  schema: itemSchemas.itemResponse
                },
                '400': {
                  description: 'Bad Request - Invalid input',
                  schema: itemSchemas.error
                },
                '404': {
                  description: 'Item not found'
                },
                '429': {
                  description: 'Too Many Requests'
                }
              },
              payloadType: 'form'
            }
          }
        },
        handler: async (request, h) => {
          const id = parseInt(request.params.id, 10);
          const input = request.payload as UpdateItemInput;
          
          // Validate input
          const validationErrors = itemService.validateUpdateItem(input);
          if (validationErrors.length > 0) {
            return h.response({ errors: validationErrors }).code(400);
          }
          
          const item = await itemService.updateItem(id, input);
          
          if (!item) {
            return h.response().code(404);
          }
          
          return h.response(item).code(200);
        }
      });

      server.route({
        method: 'DELETE',
        path: '/items/{id}',
        options: {
          description: 'Delete an item',
          notes: 'Removes an item from the system',
          tags: ['api', 'items'],
          validate: {
            params: Joi.object({
              id: idParam
            })
          },
          plugins: {
            'hapi-swagger': {
              responses: {
                '204': {
                  description: 'Item deleted successfully'
                },
                '404': {
                  description: 'Item not found'
                },
                '429': {
                  description: 'Too Many Requests'
                }
              }
            }
          }
        },
        handler: async (request, h) => {
          const id = parseInt(request.params.id, 10);
          const deleted = await itemService.deleteItem(id);
          
          if (!deleted) {
            return h.response().code(404);
          }
          
          return h.response().code(204);
        }
      });
    }
  };
};