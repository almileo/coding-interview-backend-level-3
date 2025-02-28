import Hapi from '@hapi/hapi';
import { initializeServer, startServer } from '../../src/server';
import { initializeDatabase } from '../../src/config/database';
import { registerSwagger } from '../../src/config/swagger';
import { registerRateLimiter } from '../../src/config/rateLimiter';
import { ItemRepository } from '../../src/repositories/itemRepository';
import { ItemService } from '../../src/services/itemService';

jest.mock('../../src/config/database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/config/swagger', () => ({
  registerSwagger: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/config/rateLimiter', () => ({
  registerRateLimiter: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/repositories/itemRepository');
jest.mock('../../src/services/itemService');

jest.mock('@hapi/hapi', () => {
  const mockServer = {
    register: jest.fn().mockResolvedValue({}),
    route: jest.fn(),
    start: jest.fn().mockResolvedValue({}),
    info: {
      uri: 'http://localhost:3000'
    }
  };
  
  return {
    server: jest.fn().mockReturnValue(mockServer)
  };
});

describe('Server Initialization', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('initializeServer', () => {
    it('should initialize database before creating server', async () => {
      await initializeServer();
      
      expect(initializeDatabase).toHaveBeenCalled();
      expect(Hapi.server).toHaveBeenCalled();
    });
    
    it('should register Swagger documentation', async () => {
      await initializeServer();
      
      expect(registerSwagger).toHaveBeenCalled();
    });
    
    it('should not register rate limiter in test environment', async () => {
      process.env.NODE_ENV = 'test';
      
      await initializeServer();
      
      expect(registerRateLimiter).not.toHaveBeenCalled();
    });
    
    it('should register rate limiter in non-test environments', async () => {
      process.env.NODE_ENV = 'development';
      
      await initializeServer();
      
      expect(registerRateLimiter).toHaveBeenCalled();
    });
    
    it('should initialize item repository and service', async () => {
      await initializeServer();
      
      expect(ItemRepository).toHaveBeenCalledTimes(1);
      expect(ItemService).toHaveBeenCalledTimes(1);
    });
    
    it('should register item routes', async () => {
      const server = await initializeServer();
      
      expect(server.register).toHaveBeenCalled();
    });
    
    it('should use port and host from environment variables', async () => {
      process.env.PORT = '4000';
      process.env.HOST = 'example.com';
      
      await initializeServer();
      
      expect(Hapi.server).toHaveBeenCalledWith(
        expect.objectContaining({
          port: '4000',
          host: 'example.com'
        })
      );
    });
    
    it('should use default port and host when not provided in environment', async () => {
      delete process.env.PORT;
      delete process.env.HOST;
      
      await initializeServer();
      
      expect(Hapi.server).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3000,
          host: 'localhost'
        })
      );
    });
  });
  
  describe('startServer', () => {
    it('should initialize and start the server', async () => {
      const server = await startServer();
      
      expect(initializeDatabase).toHaveBeenCalled();
      expect(server.start).toHaveBeenCalled();
    });
    
    it('should log server information after starting', async () => {
      await startServer();
      
      expect(console.log).toHaveBeenCalledWith('Server running on http://localhost:3000');
      expect(console.log).toHaveBeenCalledWith('API documentation available at http://localhost:3000/api-docs');
    });
  });
  
  describe('Validation Error Handling', () => {
    it('should extract validation configuration from server options', async () => {
      await initializeServer();
      
      const serverOptions = (Hapi.server as jest.Mock).mock.calls[0][0];
      const validationConfig = serverOptions.routes.validate;
      
      expect(validationConfig).toBeDefined();
      expect(validationConfig.failAction).toBeInstanceOf(Function);
    });
    
    it('should test the validation failAction function', async () => {
      await initializeServer();
      
      const serverOptions = (Hapi.server as jest.Mock).mock.calls[0][0];
      const failAction = serverOptions.routes.validate.failAction;
      
      const request = {};
      const h = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnThis()
      };
      
      const joiError = {
        isJoi: true,
        details: [
          { path: ['price'], message: 'must be a positive number' }
        ]
      };
      
      await failAction(request, h, joiError);
      
      expect(h.response).toHaveBeenCalledWith({
        errors: [{ field: 'price', message: 'Field "price" cannot be negative' }]
      });
      expect(h.code).toHaveBeenCalledWith(400);
      
      process.env.NODE_ENV = 'production';
      const otherError = new Error('Some other error');
      
      await failAction(request, h, otherError);
      
      expect(h.response).toHaveBeenCalledWith({
        errors: [{ field: 'unknown', message: 'Invalid input data' }]
      });
    });
  });
});