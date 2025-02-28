import 'reflect-metadata';
import { startServer } from './server';
import { initializeDatabase } from './config/database';
import { initializeCache } from './config/cache';

const init = async () => {
  try {
    await initializeDatabase();
    
    if (process.env.CACHE_ENABLED === 'true') {
      await initializeCache();
    }
    
    await startServer();
    
    console.log('Server, database, and cache initialized successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

init();