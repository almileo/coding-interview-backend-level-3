import * as Hapi from '@hapi/hapi';
import { Options as RateLimitOptions, RateLimitResponseOptions } from 'hapi-rate-limit'; 

export const rateLimiterOptions: RateLimitOptions = {
  enabled: process.env.NODE_ENV !== 'test',
  userLimit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  userCache: {
    expiresIn: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000 // ms
  },
  pathLimit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  pathCache: {
    expiresIn: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000 // ms
  },
  headers: true,
  ipWhitelist: ['127.0.0.1'], // Allow unlimited requests from localhost/testing
  userAttribute: 'ip', // Use the client's IP address for rate limiting
  limitExceededResponse: function (
    request: Hapi.Request, 
    h: Hapi.ResponseToolkit, 
    responseOptions: RateLimitResponseOptions
  ) {
    return h.response({
      status: 'error',
      message: 'Too many requests, please try again later.',
      details: responseOptions
    }).code(429);
  }
};

export const registerRateLimiter = async (server: Hapi.Server): Promise<void> => {
  await server.register({
    plugin: require('hapi-rate-limit'),
    options: rateLimiterOptions
  });
  
  console.log('Rate limiting enabled with the following settings:');
  console.log(`- User limit: ${rateLimiterOptions.userLimit} requests`);
  console.log(`- Path limit: ${rateLimiterOptions.pathLimit} requests`);
  console.log(`- Window: ${(rateLimiterOptions.userCache?.expiresIn || 0) / 1000 / 60} minutes`);
};