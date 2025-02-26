import 'reflect-metadata';
import { initializeDatabase, dataSource } from './src/config/database';

beforeAll(async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  // Initialize database
  await initializeDatabase();
});

afterAll(async () => {
  // Close database connection
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
});