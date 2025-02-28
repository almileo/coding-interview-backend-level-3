import { join } from 'path';
import { createDataSource, initializeDatabase, dataSource as dbInstance } from '../../../src/config/database';
import { ItemEntity } from '../../../src/entities/itemEntity';

jest.mock('typeorm', () => {
  const actualTypeorm = jest.requireActual('typeorm');
  
  class MockDataSource {
    options: any;
    isInitialized: boolean = false;
    
    constructor(options: any) {
      this.options = options;
    }
    
    async initialize() {
      this.isInitialized = true;
      return this;
    }
  }
  
  return {
    ...actualTypeorm,
    DataSource: jest.fn().mockImplementation((options) => new MockDataSource(options))
  };
});

describe('Database Configuration', () => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.DB_FILE;
    
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    
    console.log = jest.fn();
  });
  
  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
  });
  
  describe('createDataSource', () => {
    it('should create an in-memory SQLite database for test environment', () => {
      process.env.NODE_ENV = 'test';
      
      const ds = createDataSource();
      
      const options = (ds as any).options;
      expect(options.type).toBe('sqlite');
      expect(options.database).toBe(':memory:');
      expect(options.entities).toContain(ItemEntity);
      expect(options.synchronize).toBe(true);
      expect(options.logging).toBe(false);
    });    

  });
  
  describe('initializeDatabase', () => {
    it('should initialize the database if not already initialized', async () => {
      const ds = await initializeDatabase();
      
      expect(ds.isInitialized).toBe(true);
    });
    
    it('should reuse existing data source if already initialized', async () => {
        
      const ds1 = await initializeDatabase();
      
      (console.log as jest.Mock).mockClear();
      
      const ds2 = await initializeDatabase();
      
      expect(ds2).toBe(ds1);
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should reinitialize if the data source exists but is not initialized', async () => {
      const ds1 = await initializeDatabase();
      
      (ds1 as any).isInitialized = false;
      
      (console.log as jest.Mock).mockClear();
      
      const ds2 = await initializeDatabase();
      
      expect(ds2.isInitialized).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Database initialized successfully');
    });
  });
});