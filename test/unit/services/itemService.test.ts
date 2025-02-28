import { ItemService } from '../../../src/services/itemService';
import { ItemRepository } from '../../../src/repositories/itemRepository';
import { Item, CreateItemInput, UpdateItemInput } from '../../../src/models/item';

jest.mock('../../../src/repositories/itemRepository');

describe('ItemService', () => {
  let itemService: ItemService;
  let mockItemRepository: jest.Mocked<ItemRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mocked instance of ItemRepository
    mockItemRepository = new ItemRepository() as jest.Mocked<ItemRepository>;
    
    // Create a new instance of ItemService with the mocked repository
    itemService = new ItemService(mockItemRepository);
  });

  describe('getAllItems', () => {
    it('should return all items from the repository', async () => {
      const expectedItems: Item[] = [
        { id: 1, name: 'Item 1', price: 10 },
        { id: 2, name: 'Item 2', price: 20 }
      ];
      mockItemRepository.findAll = jest.fn().mockResolvedValue(expectedItems);

      const result = await itemService.getAllItems();

      expect(result).toEqual(expectedItems);
      expect(mockItemRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getItemById', () => {
    it('should return an item when a valid ID is provided', async () => {
      const expectedItem: Item = { id: 1, name: 'Item 1', price: 10 };
      mockItemRepository.findById = jest.fn().mockResolvedValue(expectedItem);

      const result = await itemService.getItemById(1);

      expect(result).toEqual(expectedItem);
      expect(mockItemRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when an invalid ID is provided', async () => {
      mockItemRepository.findById = jest.fn().mockResolvedValue(null);

      const result = await itemService.getItemById(99);

      expect(result).toBeNull();
      expect(mockItemRepository.findById).toHaveBeenCalledWith(99);
    });
  });

  describe('validateCreateItem', () => {
    it('should return errors if name is missing', () => {
      const input: Partial<CreateItemInput> = { price: 10 };

      const errors = itemService.validateCreateItem(input);

      expect(errors).toContainEqual({
        field: 'name',
        message: 'Field "name" is required'
      });
    });

    it('should return errors if price is missing', () => {
      const input: Partial<CreateItemInput> = { name: 'Item 1' };

      const errors = itemService.validateCreateItem(input);

      expect(errors).toContainEqual({
        field: 'price',
        message: 'Field "price" is required'
      });
    });

    it('should return errors if price is negative', () => {
      const input: CreateItemInput = { name: 'Item 1', price: -10 };

      const errors = itemService.validateCreateItem(input);

      expect(errors).toContainEqual({
        field: 'price',
        message: 'Field "price" cannot be negative'
      });
    });

    it('should return empty array if input is valid', () => {
      const input: CreateItemInput = { name: 'Item 1', price: 10 };

      const errors = itemService.validateCreateItem(input);

      expect(errors).toEqual([]);
    });
  });

  describe('validateUpdateItem', () => {
    it('should return errors if price is negative', () => {
      const input: UpdateItemInput = { price: -10 };

      const errors = itemService.validateUpdateItem(input);

      expect(errors).toContainEqual({
        field: 'price',
        message: 'Field "price" cannot be negative'
      });
    });

    it('should return empty array if input is valid', () => {
      const input: UpdateItemInput = { name: 'Updated Item', price: 20 };

      const errors = itemService.validateUpdateItem(input);

      expect(errors).toEqual([]);
    });

    it('should return empty array if only name is provided', () => {
      const input: UpdateItemInput = { name: 'Updated Item' };

      const errors = itemService.validateUpdateItem(input);

      expect(errors).toEqual([]);
    });
  });

  describe('createItem', () => {
    it('should create and return a new item', async () => {
      const input: CreateItemInput = { name: 'New Item', price: 15 };
      const expectedItem: Item = { id: 1, ...input };
      mockItemRepository.create = jest.fn().mockResolvedValue(expectedItem);

      const result = await itemService.createItem(input);

      expect(result).toEqual(expectedItem);
      expect(mockItemRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateItem', () => {
    it('should update and return an item when valid ID is provided', async () => {
      const id = 1;
      const input: UpdateItemInput = { name: 'Updated Item', price: 25 };
      const expectedItem: Item = { id, name: input.name!, price: input.price! };
      mockItemRepository.update = jest.fn().mockResolvedValue(expectedItem);

      const result = await itemService.updateItem(id, input);

      expect(result).toEqual(expectedItem);
      expect(mockItemRepository.update).toHaveBeenCalledWith(id, input);
    });

    it('should return null when an invalid ID is provided', async () => {
      const id = 99;
      const input: UpdateItemInput = { name: 'Updated Item', price: 25 };
      mockItemRepository.update = jest.fn().mockResolvedValue(null);

      const result = await itemService.updateItem(id, input);

      expect(result).toBeNull();
      expect(mockItemRepository.update).toHaveBeenCalledWith(id, input);
    });
  });

  describe('deleteItem', () => {
    it('should return true when item is successfully deleted', async () => {
      mockItemRepository.delete = jest.fn().mockResolvedValue(true);

      const result = await itemService.deleteItem(1);

      expect(result).toBe(true);
      expect(mockItemRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when item to delete is not found', async () => {
      mockItemRepository.delete = jest.fn().mockResolvedValue(false);

      const result = await itemService.deleteItem(99);

      expect(result).toBe(false);
      expect(mockItemRepository.delete).toHaveBeenCalledWith(99);
    });
  });
});