import { DataSource } from 'typeorm';
import { join } from 'path';
import { ItemEntity } from '../entities/itemEntity';

// Load environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';

export const createDataSource = () => {
  // Use in-memory database for tests
  if (NODE_ENV === 'test') {
    return new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [ItemEntity],
      synchronize: true,
      logging: false
    });
  }

  // Use file-based database for development and production
  return new DataSource({
    type: 'sqlite',
    database: process.env.DB_FILE || join(process.cwd(), 'database.sqlite'),
    entities: [ItemEntity],
    synchronize: NODE_ENV === 'development',
    logging: NODE_ENV === 'development'
  });
};

export let dataSource: DataSource;

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!dataSource || !dataSource.isInitialized) {
    dataSource = createDataSource();
    await dataSource.initialize();
    console.log('Database initialized successfully');
  }
  return dataSource;
};