// src/models/validation.ts
import Joi from 'joi';

export const itemSchemas = {
  createItem: Joi.object({
    name: Joi.string().required().description('Item name'),
    price: Joi.number().positive().required().description('Item price')
  }).label('CreateItemInput'),
  
  updateItem: Joi.object({
    name: Joi.string().optional().description('Updated item name'),
    price: Joi.number().positive().optional().description('Updated item price')
  }).label('UpdateItemInput'),
  
  itemResponse: Joi.object({
    id: Joi.number().required().description('Item unique identifier'),
    name: Joi.string().required().description('Item name'),
    price: Joi.number().required().description('Item price')
  }).label('Item'),
  
  itemList: Joi.array().items(
    Joi.object({
      id: Joi.number().required().description('Item unique identifier'),
      name: Joi.string().required().description('Item name'),
      price: Joi.number().required().description('Item price')
    })
  ).label('ItemList'),
  
  error: Joi.object({
    errors: Joi.array().items(
      Joi.object({
        field: Joi.string().required(),
        message: Joi.string().required()
      }).label('ValidationErrorDetail')
    )
  }).label('ValidationError')
};

export const idParam = Joi.number().required().description('Item ID');