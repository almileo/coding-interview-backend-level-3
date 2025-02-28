import { ItemRepository } from '../../../src/repositories/itemRepository';
import { ItemEntity } from '../../../src/entities/itemEntity';
import { CreateItemInput, UpdateItemInput } from '../../../src/models/item';
import { dataSource } from '../../../src/config/database';
import * as cacheModule from '../../../src/config/cache';

// Mock the entire cache module
jest.mock('../../../src/config/cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  clearCache: jest.fn()
}));

// Mock TypeORM DataSource
jest.mock('../../../src/config/database', () => {
  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  };

  return {
    dataSource: {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      isInitialized: true
    }
  };
});

describe('ItemRepository', () => {
  let itemRepository: ItemRepository;
  let mockTypeOrmRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.CACHE_ENABLED = 'true';
    process.env.CACHE_TTL = '3600';

    mockTypeOrmRepo = dataSource.getRepository(ItemEntity);

    itemRepository = new ItemRepository();
  });

  describe('findAll', () => {
    it('should return items from cache if available', async () => {
      const cachedItems = [{ id: 1, name: 'Cached Item', price: 10 }];
      (cacheModule.getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedItems));

      const result = await itemRepository.findAll();

      expect(result).toEqual(cachedItems);
      expect(cacheModule.getCache).toHaveBeenCalledWith('items:all');
      expect(mockTypeOrmRepo.find).not.toHaveBeenCalled();
    });

    it('should return items from database and cache them if not in cache', async () => {

      (cacheModule.getCache as jest.Mock).mockResolvedValue(null);
      const dbItems = [
        { id: 1, name: 'Item 1', price: 10 },
        { id: 2, name: 'Item 2', price: 20 }
      ];
      mockTypeOrmRepo.find.mockResolvedValue(dbItems);

      const result = await itemRepository.findAll();

      expect(result).toEqual(dbItems);
      expect(cacheModule.getCache).toHaveBeenCalledWith('items:all');
      expect(mockTypeOrmRepo.find).toHaveBeenCalled();
      expect(cacheModule.setCache).toHaveBeenCalledWith(
        'items:all',
        JSON.stringify(dbItems),
        3600
      );
    });
  });

  describe('findById', () => {
    it('should return item from cache if available', async () => {

      const cachedItem = { id: 1, name: 'Cached Item', price: 10 };
      (cacheModule.getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedItem));

      const result = await itemRepository.findById(1);

      expect(result).toEqual(cachedItem);
      expect(cacheModule.getCache).toHaveBeenCalledWith('items:1');
      expect(mockTypeOrmRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('should return item from database and cache it if not in cache', async () => {

      (cacheModule.getCache as jest.Mock).mockResolvedValue(null);
      const dbItem = { id: 1, name: 'Item 1', price: 10 };
      mockTypeOrmRepo.findOneBy.mockResolvedValue(dbItem);

      const result = await itemRepository.findById(1);

      expect(result).toEqual(dbItem);
      expect(cacheModule.getCache).toHaveBeenCalledWith('items:1');
      expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(cacheModule.setCache).toHaveBeenCalledWith(
        'items:1',
        JSON.stringify(dbItem),
        3600
      );
    });

    it('should return null when item is not found', async () => {

      (cacheModule.getCache as jest.Mock).mockResolvedValue(null);
      mockTypeOrmRepo.findOneBy.mockResolvedValue(null);

      const result = await itemRepository.findById(99);

      expect(result).toBeNull();
      expect(cacheModule.getCache).toHaveBeenCalledWith('items:99');
      expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(cacheModule.setCache).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create an item and invalidate cache', async () => {
      const input: CreateItemInput = { name: 'New Item', price: 15 };
      const newEntity = { id: 1, ...input };
      mockTypeOrmRepo.create.mockReturnValue(newEntity);
      mockTypeOrmRepo.save.mockResolvedValue(newEntity);

      const result = await itemRepository.create(input);

      expect(result).toEqual(newEntity);
      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(input);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(newEntity);
      expect(cacheModule.clearCache).toHaveBeenCalledWith('items:all');
      expect(cacheModule.setCache).toHaveBeenCalledWith(
        'items:1',
        JSON.stringify(newEntity),
        3600
      );
    });
  });

  describe('update', () => {
    it('should update an item and invalidate cache if item exists', async () => {
      const id = 1;
      const existingItem = { id, name: 'Old Item', price: 10 };
      const updateInput: UpdateItemInput = { name: 'Updated Item', price: 20 };
      const updatedItem = { ...existingItem, ...updateInput };

      mockTypeOrmRepo.findOneBy.mockResolvedValue(existingItem);
      mockTypeOrmRepo.save.mockResolvedValue(updatedItem);

      const result = await itemRepository.update(id, updateInput);

      expect(result).toEqual(updatedItem);
      expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id });
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id,
        name: 'Updated Item',
        price: 20
      }));
      expect(cacheModule.clearCache).toHaveBeenCalledWith('items:all');
      expect(cacheModule.setCache).toHaveBeenCalledWith(
        `items:${id}`,
        JSON.stringify(updatedItem),
        3600
      );
    });

    it('should return null if item does not exist', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(null);

      const result = await itemRepository.update(99, { name: 'Updated Item' });

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(mockTypeOrmRepo.save).not.toHaveBeenCalled();
      expect(cacheModule.clearCache).not.toHaveBeenCalled();
      expect(cacheModule.setCache).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an item and invalidate cache if successful', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await itemRepository.delete(1);

      expect(result).toBe(true);
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith(1);
      expect(cacheModule.clearCache).toHaveBeenCalledWith('items:all');
      expect(cacheModule.clearCache).toHaveBeenCalledWith('items:1');
    });

    it('should return false if item does not exist', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 0 });

      const result = await itemRepository.delete(99);

      expect(result).toBe(false);
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith(99);
      expect(cacheModule.clearCache).not.toHaveBeenCalled();
    });
  });

  describe('cache options', () => {
    it('should not use cache if disabled', async () => {
      process.env.CACHE_ENABLED = 'false';
      itemRepository = new ItemRepository();
      const dbItems = [{ id: 1, name: 'Item 1', price: 10 }];
      mockTypeOrmRepo.find.mockResolvedValue(dbItems);

      const result = await itemRepository.findAll();

      expect(result).toEqual(dbItems);
      expect(cacheModule.getCache).not.toHaveBeenCalled();
      expect(cacheModule.setCache).not.toHaveBeenCalled();
    });
  });
});