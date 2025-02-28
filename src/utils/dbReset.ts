import { dataSource } from "../config/database";
import { ItemEntity } from "../entities/itemEntity";

/**
 * This reset is for testing purposes
 */
export const resetDatabase = async (): Promise<void> => {
  if (!dataSource.isInitialized) {
    throw new Error('Database is not initialized');
  }
  
  try {
    // Clear all tables
    await dataSource.getRepository(ItemEntity).clear();
    console.log('Database reset successful');
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
};