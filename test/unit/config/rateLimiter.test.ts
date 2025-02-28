import * as Hapi from '@hapi/hapi';
import { rateLimiterOptions, registerRateLimiter } from '../../../src/config/rateLimiter';

jest.mock('hapi-rate-limit', () => ({}));

describe('Rate Limiter Configuration', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MINUTES;
    
    console.log = jest.fn();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('rateLimiterOptions', () => {
    it('should use default values when environment variables are not set', () => {
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.userLimit).toBe(100);
      expect(rateLimiterOptions.pathLimit).toBe(100);
      expect(rateLimiterOptions.userCache?.expiresIn).toBe(15 * 60 * 1000);
      expect(rateLimiterOptions.pathCache?.expiresIn).toBe(15 * 60 * 1000);
    });
    
    it('should use environment variables when provided', () => {
      process.env.RATE_LIMIT_MAX = '50';
      process.env.RATE_LIMIT_WINDOW_MINUTES = '30';
      
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.userLimit).toBe(50);
      expect(rateLimiterOptions.pathLimit).toBe(50);
      expect(rateLimiterOptions.userCache?.expiresIn).toBe(30 * 60 * 1000);
      expect(rateLimiterOptions.pathCache?.expiresIn).toBe(30 * 60 * 1000);
    });
    
    it('should disable rate limiting in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.enabled).toBe(false);
    });
    
    it('should enable rate limiting in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.enabled).toBe(true);
    });
    
    it('should whitelist localhost IP address', () => {
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.ipWhitelist).toContain('127.0.0.1');
    });
    
    it('should use IP address as the user attribute for rate limiting', () => {
      jest.resetModules();
      const { rateLimiterOptions } = require('../../../src/config/rateLimiter');
      
      expect(rateLimiterOptions.userAttribute).toBe('ip');
    });
  });
  
  describe('limitExceededResponse', () => {
    it('should return a 429 response with error details', () => {
      const request = {} as Hapi.Request;
      
      const h = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis()
      } as unknown as Hapi.ResponseToolkit;
      
      const responseOptions = {
        limit: 100,
        remaining: 0,
        reset: 1234567890
      };
      
      const response = rateLimiterOptions.limitExceededResponse!(request, h, responseOptions);
      
      expect(h.response).toHaveBeenCalledWith({
        status: 'error',
        message: 'Too many requests, please try again later.',
        details: responseOptions
      });
      
      expect(h.response().code).toHaveBeenCalledWith(429);
    });
  });
  
  describe('registerRateLimiter', () => {
    it('should register the hapi-rate-limit plugin with the server', async () => {
      const server = {
        register: jest.fn().mockResolvedValue(undefined)
      } as unknown as Hapi.Server;
      
      await registerRateLimiter(server);
      
      expect(server.register).toHaveBeenCalledWith({
        plugin: require('hapi-rate-limit'),
        options: rateLimiterOptions
      });
    });
    
    it('should log rate limiter settings', async () => {
      const server = {
        register: jest.fn().mockResolvedValue(undefined)
      } as unknown as Hapi.Server;
      
      await registerRateLimiter(server);
      
      expect(console.log).toHaveBeenCalledWith('Rate limiting enabled with the following settings:');
      expect(console.log).toHaveBeenCalledWith(`- User limit: ${rateLimiterOptions.userLimit} requests`);
      expect(console.log).toHaveBeenCalledWith(`- Path limit: ${rateLimiterOptions.pathLimit} requests`);
      expect(console.log).toHaveBeenCalledWith(`- Window: ${(rateLimiterOptions.userCache?.expiresIn || 0) / 1000 / 60} minutes`);
    });
  });
});