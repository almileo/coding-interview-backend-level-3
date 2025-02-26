import * as Hapi from '@hapi/hapi';
import { Options } from 'hapi-rate-limit';

export const rateLimiterOptions: Options = {
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
  trustProxy: true,
  enableRateLimitHeaders: true,
  userAttribute: 'ip', // Use the client's IP address for rate limiting
  limitExceededResponse: function (request, h, responseOptions) {
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
    options: {
      ...rateLimiterOptions,
      pathLimitPostOnly: true,
      userPathLimit: false,
      // Define specific path limits
      pathLimits: [
        { path: '/items', method: 'post', limit: parseInt(process.env.RATE_LIMIT_ITEMS_MODIFY || '20', 10) },
        { path: '/items/{id}', method: 'put', limit: parseInt(process.env.RATE_LIMIT_ITEMS_MODIFY || '20', 10) },
        { path: '/items/{id}', method: 'delete', limit: parseInt(process.env.RATE_LIMIT_ITEMS_MODIFY || '20', 10) }
      ]
    }
  });
  
  console.log('Rate limiting enabled with the following settings:');
  console.log(`- User limit: ${rateLimiterOptions.userLimit} requests`);
  console.log(`- Path limit: ${rateLimiterOptions.pathLimit} requests`);
  console.log(`- Window: ${(rateLimiterOptions.userCache?.expiresIn || 0) / 1000 / 60} minutes`);
};