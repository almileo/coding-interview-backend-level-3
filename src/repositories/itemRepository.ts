import { Repository } from 'typeorm';
import { ItemEntity } from '../entities/itemEntity';
import { Item, CreateItemInput, UpdateItemInput } from '../models/item';
import { dataSource } from '../config/database';

export class ItemRepository {
  private repository: Repository<ItemEntity>;

  constructor() {
    this.repository = dataSource.getRepository(ItemEntity);
  }

  async findAll(): Promise<Item[]> {
    const items = await this.repository.find();
    return items.map(item => this.mapEntityToModel(item));
  }

  async findById(id: number): Promise<Item | null> {
    const item = await this.repository.findOneBy({ id });
    return item ? this.mapEntityToModel(item) : null;
  }

  async create(input: CreateItemInput): Promise<Item> {
    const entity = this.repository.create({
      name: input.name,
      price: input.price
    });

    const savedEntity = await this.repository.save(entity);
    return this.mapEntityToModel(savedEntity);
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
    return this.mapEntityToModel(updatedEntity);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }

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
  }
}