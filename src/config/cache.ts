import Redis from 'ioredis';

// Track Redis state
let redisClient: Redis | null = null;
let redisDisabled = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export const initializeCache = async (): Promise<Redis | null> => {
  // Skip if already disabled due to previous failures
  if (redisDisabled) {
    console.log('Redis cache is disabled due to previous connection failures');
    return null;
  }
  
  // Check if cache is enabled via environment variable
  if (process.env.CACHE_ENABLED !== 'true') {
    console.log('Redis cache is disabled by configuration');
    return null;
  }
  
  if (!redisClient) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      redisClient = new Redis(redisUrl, {
        connectTimeout: 5000, // 5 second timeout
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          connectionAttempts++;
          
          // Stop retrying after max attempts
          if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            console.warn(`Redis connection failed after ${MAX_CONNECTION_ATTEMPTS} attempts. Cache will be disabled.`);
            redisDisabled = true;
            return null; // Stop retrying
          }
          
          const delay = Math.min(times * 200, 2000);
          console.warn(`Redis connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS} failed. Retrying in ${delay}ms...`);
          return delay;
        }
      });

      // Set up one-time ready event
      redisClient.once('ready', () => {
        console.log('Redis cache successfully connected and initialized');
        connectionAttempts = 0; // Reset attempts on successful connection
      });

      // Set up ongoing error handling
      redisClient.on('error', (error) => {
        if (!redisDisabled) {
          console.warn(`Redis error: ${error.message}`);
          
          // Only count errors after initial connection as new attempts
          if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            connectionAttempts++;
          }
          
          // Disable Redis after max attempts
          if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            console.warn(`Redis connection failed after ${MAX_CONNECTION_ATTEMPTS} attempts. Cache will be disabled.`);
            redisDisabled = true;
            
            // Clean up Redis connection to prevent memory leaks
            try {
              redisClient?.disconnect();
              redisClient = null;
            } catch (e) {
              console.error('Error disconnecting from Redis:', e);
            }
          }
        }
      });
      
      // Test connection with ping
      try {
        await redisClient.ping();
      } catch (error) {
        // Connection test failed, but we'll let the retry strategy handle it
      }
    } catch (error) {
      console.warn('Failed to initialize Redis cache:', error);
      redisDisabled = true;
      redisClient = null;
      return null;
    }
  }
  
  // Return client only if not disabled
  return redisDisabled ? null : redisClient;
};

// Cache utilities
export const getCache = async (key: string): Promise<string | null> => {
  if (!redisClient || redisDisabled) return null;
  
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('Redis get error:', error);
    return null;
  }
};

export const setCache = async (key: string, value: string, expiryInSeconds = 3600): Promise<void> => {
  if (!redisClient || redisDisabled) return;
  
  try {
    await redisClient.set(key, value, 'EX', expiryInSeconds);
  } catch (error) {
    console.warn('Redis set error:', error);
  }
};

export const clearCache = async (pattern: string): Promise<void> => {
  if (!redisClient || redisDisabled) return;
  
  try {
    // Find all keys matching the pattern
    const keys = await redisClient.keys(pattern);
    
    // Delete the keys if any were found
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.warn('Redis clear error:', error);
  }
};