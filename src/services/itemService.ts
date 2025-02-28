import { Item, CreateItemInput, UpdateItemInput, ValidationError } from '../models/item';
import { ItemRepository } from '../repositories/itemRepository';

export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  async getAllItems(): Promise<Item[]> {
    return this.itemRepository.findAll();
  }

  async getItemById(id: number): Promise<Item | null> {
    return this.itemRepository.findById(id);
  }

  validateCreateItem(input: Partial<CreateItemInput>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (input.name === undefined) {
      errors.push({ field: 'name', message: 'Field "name" is required' });
    }

    if (input.price === undefined) {
      errors.push({ field: 'price', message: 'Field "price" is required' });
    } else if (input.price < 0) {
      errors.push({ field: 'price', message: 'Field "price" cannot be negative' });
    }
    return errors;
  }

  validateUpdateItem(input: UpdateItemInput): ValidationError[] {
    const errors: ValidationError[] = [];

    if (input.price !== undefined && input.price < 0) {
      errors.push({ field: 'price', message: 'Field "price" cannot be negative' });
    }

    return errors;
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    return this.itemRepository.create(input);
  }

  async updateItem(id: number, input: UpdateItemInput): Promise<Item | null> {
    return this.itemRepository.update(id, input);
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.itemRepository.delete(id);
  }
}