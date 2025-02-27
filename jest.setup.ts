import 'reflect-metadata';
import { initializeDatabase, dataSource } from './src/config/database';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  
  await initializeDatabase();
});

afterAll(async () => {
  // Close database connection if open
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
});