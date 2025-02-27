import { Repository } from 'typeorm';
import { ItemEntity } from '../entities/itemEntity';
import { Item, CreateItemInput, UpdateItemInput } from '../models/item';
import { dataSource } from '../config/database';
import { getCache, setCache, clearCache } from '../config/cache';

export class ItemRepository {
  private repository: Repository<ItemEntity>;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  constructor() {
    this.repository = dataSource.getRepository(ItemEntity);
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    this.cacheTTL = parseInt(process.env.CACHE_TTL || '3600', 10);
  }

  async findAll(): Promise<Item[]> {
    // Try to get from cache first
    if (this.cacheEnabled) {
      const cachedItems = await getCache('items:all');
      if (cachedItems) {
        return JSON.parse(cachedItems);
      }
    }

    // If not in cache or cache disabled, get from database
    const items = await this.repository.find();
    const mappedItems = items.map(item => this.mapEntityToModel(item));
    
    // Store in cache for future requests
    if (this.cacheEnabled) {
      await setCache('items:all', JSON.stringify(mappedItems), this.cacheTTL);
    }
    
    return mappedItems;
  }

  async findById(id: number): Promise<Item | null> {
    if (this.cacheEnabled) {
      const cachedItem = await getCache(`items:${id}`);
      if (cachedItem) {
        return JSON.parse(cachedItem);
      }
    }

    const item = await this.repository.findOneBy({ id });
    
    if (!item) {
      return null;
    }
    
    const mappedItem = this.mapEntityToModel(item);
    
    if (this.cacheEnabled) {
      await setCache(`items:${id}`, JSON.stringify(mappedItem), this.cacheTTL);
    }
    
    return mappedItem;
  }

  async create(input: CreateItemInput): Promise<Item> {
    const entity = this.repository.create({
      name: input.name,
      price: input.price
    });
    
    const savedEntity = await this.repository.save(entity);
    const mappedItem = this.mapEntityToModel(savedEntity);
    
    // Invalidate relevant caches
    if (this.cacheEnabled) {
      await clearCache('items:all');
      await setCache(`items:${mappedItem.id}`, JSON.stringify(mappedItem), this.cacheTTL);
    }
    
    return mappedItem;
  }

  async update(id: number, input: UpdateItemInput): Promise<Item | null> {
    const entity = await this.repository.findOneBy({ id });
    
    if (!entity) {
      return null;
    }
    
    // Update only provided fields
    if (input.name !== undefined) {
      entity.name = input.name;
    }
    
    if (input.price !== undefined) {
      entity.price = input.price;
    }
    
    const updatedEntity = await this.repository.save(entity);
    const mappedItem = this.mapEntityToModel(updatedEntity);
    
    // Invalidate relevant caches
    if (this.cacheEnabled) {
      await clearCache('items:all');
      await setCache(`items:${id}`, JSON.stringify(mappedItem), this.cacheTTL);
    }
    
    return mappedItem;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    const deleted = result.affected !== null && result.affected !== undefined && result.affected > 0;
    
    // Invalidate relevant caches
    if (deleted && this.cacheEnabled) {
      await clearCache('items:all');
      await clearCache(`items:${id}`);
    }
    
    return deleted;
  }

  // Helper method to map entity to model
  private mapEntityToModel(entity: ItemEntity): Item {
    return {
      id: entity.id,
      name: entity.name,
      price: entity.price
    };
  }

  // For testing: clear the repository
  async clear(): Promise<void> {
    await this.repository.clear();
    
    // Clear all item caches
    if (this.cacheEnabled) {
      await clearCache('items:*');
    }
  }
}