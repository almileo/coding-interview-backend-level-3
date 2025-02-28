import * as Hapi from '@hapi/hapi';
import { registerRateLimiter } from '../../../src/config/rateLimiter';


describe('Rate Limiter Integration', () => {
  let server: Hapi.Server;
  const originalEnv = { ...process.env };
  
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production'; // Enable rate limiting
    process.env.RATE_LIMIT_MAX = '5'; // Set a low limit for testing
    process.env.RATE_LIMIT_WINDOW_MINUTES = '1'; // Short window for testing
    
    server = Hapi.server({
      port: 0, // Use any available port
      host: 'localhost'
    });
    
    server.route({
      method: 'GET',
      path: '/test',
      handler: (request, h) => {
        return { status: 'success' };
      }
    });
    
    console.log = jest.fn();
    
    await registerRateLimiter(server);
    
    await server.start();
  });
  
  afterEach(async () => {
    await server.stop();
    
    process.env = originalEnv;
  });
  
  it('should register the rate limiter plugin with the server', () => {
    const registeredPlugins = server.registrations;
    expect(registeredPlugins['hapi-rate-limit']).toBeDefined();
  });  
  
  it('should not rate limit requests from whitelisted IPs', async () => {
    const options = {
      method: 'GET',
      url: '/test',
      remoteAddress: '127.0.0.1'
    };
    
    for (let i = 0; i < 10; i++) {
      const response = await server.inject(options);
      
      expect(response.statusCode).toBe(200);
    }
  });
  
  it('should disable rate limiting in test environment', async () => {
    await server.stop();
    
    process.env.NODE_ENV = 'test';
    
    jest.resetModules();
    const { registerRateLimiter } = require('../../../src/config/rateLimiter');
    
    const testServer = Hapi.server({
      port: 0,
      host: 'localhost'
    });
    
    testServer.route({
      method: 'GET',
      path: '/test',
      handler: (request, h) => {
        return { status: 'success' };
      }
    });
    
    await registerRateLimiter(testServer);
    await testServer.start();
    
    try {
      for (let i = 0; i < 10; i++) {
        const response = await testServer.inject({
          method: 'GET',
          url: '/test'
        });
        
        expect(response.statusCode).toBe(200);
      }
    } finally {
      await testServer.stop();
    }
  });
});