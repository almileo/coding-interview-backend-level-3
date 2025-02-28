import { initializeServer } from '../../src/server';
import { Server } from '@hapi/hapi';
import { resetDatabase } from '../../src/utils/dbReset';
import { dataSource } from '../../src/config/database';
import { ItemEntity } from '../../src/entities/itemEntity';

describe('API Routes Integration Tests', () => {
  let server: Server;
  
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    server = await initializeServer();
  });
  
  beforeEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      await resetDatabase();
    }
  });

  describe('Health Check', () => {
    it('should return 200 OK with correct response from /ping', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ping'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual({ ok: true });
    });

    it('should return 200 OK with welcome message from /', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.result).toHaveProperty('message', 'Welcome to the API');
    });
  });

  describe('Items API', () => {
    describe('GET /items', () => {
      it('should return empty array when no items exist', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/items'
        });
        
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual([]);
      });
      
      it('should return array of items when items exist', async () => {
        const item = new ItemEntity();
        item.name = 'Test Item';
        item.price = 10;
        await dataSource.getRepository(ItemEntity).save(item);
        
        const response = await server.inject({
          method: 'GET',
          url: '/items'
        });
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.result)).toBe(true);
        expect(response.result).toHaveLength(1);
        expect(response.result).toBeDefined();
        expect(response.result![0]).toHaveProperty('name', 'Test Item');
        expect(response.result![0]).toHaveProperty('price', 10);
      });
    });
    
    describe('GET /items/{id}', () => {
      it('should return 404 when item does not exist', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/items/999'
        });
        
        expect(response.statusCode).toBe(404);
      });
      
      it('should return item when it exists', async () => {
        const item = new ItemEntity();
        item.name = 'Test Item';
        item.price = 10;
        const savedItem = await dataSource.getRepository(ItemEntity).save(item);
        
        const response = await server.inject({
          method: 'GET',
          url: `/items/${savedItem.id}`
        });
        
        expect(response.statusCode).toBe(200);
        expect(response.result).toHaveProperty('id', savedItem.id);
        expect(response.result).toHaveProperty('name', 'Test Item');
        expect(response.result).toHaveProperty('price', 10);
      });
      
      it('should return 400 for invalid ID format', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/items/invalid-id'
        });
        
        expect(response.statusCode).toBe(400);
      });
    });
    
    describe('POST /items', () => {
      it('should create a new item with valid input', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/items',
          payload: {
            name: 'New Item',
            price: 15.99
          }
        });
        
        expect(response.statusCode).toBe(201);
        expect(response.result).toHaveProperty('id');
        expect(response.result).toHaveProperty('name', 'New Item');
        expect(response.result).toHaveProperty('price', 15.99);
        
        const savedItem = await dataSource.getRepository(ItemEntity).findOneBy({ 
          id: (response.result as any).id 
        });
        expect(savedItem).not.toBeNull();
        expect(savedItem?.name).toBe('New Item');
      });
      
      it('should return 400 when name is missing', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/items',
          payload: {
            price: 15.99
          }
        });
        
        expect(response.statusCode).toBe(400);
        expect(response.result).toHaveProperty('errors');
        expect(Array.isArray((response.result as any).errors)).toBe(true);
        
        const errors = (response.result as any).errors;
        expect(errors.some((e: any) => e.field === 'name')).toBe(true);
      });
      
      it('should return 400 when price is missing', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/items',
          payload: {
            name: 'New Item'
          }
        });
        
        expect(response.statusCode).toBe(400);
        expect(response.result).toHaveProperty('errors');
        
        const errors = (response.result as any).errors;
        expect(errors.some((e: any) => e.field === 'price')).toBe(true);
      });
      
      it('should return 400 when price is negative', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/items',
          payload: {
            name: 'New Item',
            price: -10
          }
        });
        
        expect(response.statusCode).toBe(400);
        expect(response.result).toHaveProperty('errors');
        
        const errors = (response.result as any).errors;
        expect(errors.some((e: any) => e.field === 'price' && e.message.includes('negative'))).toBe(true);
      });
    });
    
    describe('PUT /items/{id}', () => {
      it('should update an existing item', async () => {
        const item = new ItemEntity();
        item.name = 'Original Item';
        item.price = 10;
        const savedItem = await dataSource.getRepository(ItemEntity).save(item);
        
        const response = await server.inject({
          method: 'PUT',
          url: `/items/${savedItem.id}`,
          payload: {
            name: 'Updated Item',
            price: 20
          }
        });
        
        expect(response.statusCode).toBe(200);
        expect(response.result).toHaveProperty('id', savedItem.id);
        expect(response.result).toHaveProperty('name', 'Updated Item');
        expect(response.result).toHaveProperty('price', 20);
        
        const updatedItem = await dataSource.getRepository(ItemEntity).findOneBy({ id: savedItem.id });
        expect(updatedItem).not.toBeNull();
        expect(updatedItem?.name).toBe('Updated Item');
        expect(updatedItem?.price).toBe(20);
      });
      
      it('should return 404 when updating non-existent item', async () => {
        const response = await server.inject({
          method: 'PUT',
          url: '/items/999',
          payload: {
            name: 'Updated Item',
            price: 20
          }
        });
        
        expect(response.statusCode).toBe(404);
      });
      
      it('should return 400 when price is negative', async () => {
        const item = new ItemEntity();
        item.name = 'Original Item';
        item.price = 10;
        const savedItem = await dataSource.getRepository(ItemEntity).save(item);
        
        const response = await server.inject({
          method: 'PUT',
          url: `/items/${savedItem.id}`,
          payload: {
            price: -20
          }
        });
        
        expect(response.statusCode).toBe(400);
        expect(response.result).toHaveProperty('errors');
        
        const errors = (response.result as any).errors;
        expect(errors.some((e: any) => e.field === 'price' && e.message.includes('negative'))).toBe(true);
        
        const itemInDb = await dataSource.getRepository(ItemEntity).findOneBy({ id: savedItem.id });
        expect(itemInDb?.price).toBe(10);
      });
    });
    
    describe('DELETE /items/{id}', () => {
      it('should delete an existing item', async () => {
        const item = new ItemEntity();
        item.name = 'Item to Delete';
        item.price = 10;
        const savedItem = await dataSource.getRepository(ItemEntity).save(item);
        
        const response = await server.inject({
          method: 'DELETE',
          url: `/items/${savedItem.id}`
        });
        
        expect(response.statusCode).toBe(204);
        
        const deletedItem = await dataSource.getRepository(ItemEntity).findOneBy({ id: savedItem.id });
        expect(deletedItem).toBeNull();
      });
      
      it('should return 404 when deleting non-existent item', async () => {
        const response = await server.inject({
          method: 'DELETE',
          url: '/items/999'
        });
        
        expect(response.statusCode).toBe(404);
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
    
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
});