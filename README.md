# Coding Interview Backend (Level 3) - Leonardo Almiron

A RESTful API for performing CRUD operations on `Item` entities, built with Hapi.js, TypeORM, and TypeScript.

## Features

- Complete CRUD operations for Item entities (id, name, price)
- Persistent data storage with TypeORM and SQLite
- Input validation using Joi
- API documentation with Swagger
- Rate limiting for API protection
- E2E tests
- Postman collection for testing

## Project Structure

```
├── .devcontainer/          # Development container configuration
│   └── devcontainer.json
|    └── Dockerfile          # Docker configuration
├── 
├── coverage/               # Test coverage reports
├── e2e/                    # End-to-end tests
│   └── index.test.ts
├── node_modules/           # Node.js dependencies
├── src/                    # Source code
│   ├── config/             # Configuration files
│   │   ├── cache.ts        # Cache configuration
│   │   ├── database.ts     # Database configuration
│   │   ├── rateLimiter.ts  # Rate limiter configuration
│   │   └── swagger.ts      # API documentation configuration
│   ├── entities/           # Database entities
│   │   └── itemEntity.ts
│   ├── models/             # Data models
│   │   ├── item.ts         # Item model definition
│   │   └── validation.ts   # Data validation utilities
│   ├── repositories/       # Data access layer
│   │   └── itemRepository.ts
│   ├── routes/             # API routes
│   │   └── itemRoutes.ts
│   ├── services/           # Business logic
│   │   └── itemService.ts
│   ├── utils/              # Utility functions
│   │   ├── dbReset.ts      # Database reset utility
│   │   └── types.d.ts      # TypeScript type definitions
│   ├── index.ts            # Application entry point
│   └── server.ts           # Server configuration
├── test/                   # Test files
│   ├── integration/        # Integration tests
│   │   └── config/         # Test configuration
│   │   |   ├── rateLimiter.test.ts
│   │   └── routes.test.ts
│   └── unit/               # Unit tests
│       ├── config/         # Configuration tests
│       │   ├── database.test.ts
│       │   └── rateLimiter.test.ts
│       ├── repositories/   # Repository tests
│       │   └── itemRepository.test.ts
│       └── services/       # Service tests
│       |    ├── itemService.test.ts
│       └── server.test.ts
├── .env                    # Environment variables (not committed)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore file
├── database.sqlite         # SQLite database file
├── coding_interview_leonardo_almiron_local_env.postman_environment.json  # Postman file
├── coding_interview_leonardo_almiron.postman_collection.json             # Postman file
├── jest.config.js          # Jest testing configuration
├── jest.setup.ts           # Jest setup file
├── package.json            # Node.js package configuration
├── package-lock.json       # Dependency lock file
├── README-requirements.md  # Original requirements
├── tsconfig.json           # TypeScript configuration
```
## Getting Started
## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (optional, for containerized development)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/almileo/coding-interview-backend-level-3.git
   cd coding-interview-backend-level-3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

## Development

### Using Local Environment

Start the development server:
```bash
npm run dev
```

### Using Docker

Build and start the Docker container:
```bash
docker build -t backend-app .
docker run -p 3000:3000 backend-app
```

## Testing

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test

# Test coverage
npm run test:coverage
```
## API Endpoints

- ```GET /ping``` - Health check endpoint
- ```GET /items``` - Get all items
- ```GET /items/:id``` - Get a specific item by ID
- ```POST /items``` - Create a new item
- ```PUT /items/:id``` - Update an existing item
- ```DELETE /items/:id``` - Delete an item
- ```GET /api-docs``` - API documentation (Swagger UI)


## API Documentation

### Swagger Documentation
Interactive API documentation is available at /api-docs when the server is running. This provides:

- Detailed information about all endpoints
- Request/response schemas
- Try-it-out functionality to test endpoints directly
- Error responses

```
http://localhost:3000/api-docs
```
### Postman Collection
A Postman collection is included for API testing:

1. Import the following files into Postman:

   - ```coding_interview_leonardo_almiron.postman_collection.json``` - API collection
   - ```coding_interview_leonardo_almiron_local_env.postman_environment.json``` - Environment variables


2. Select the "Coding Interview Leonardo Almiron - Local" environment from the dropdown
3. Use the collection to test all endpoints

## Data Persistence
The API uses SQLite for data storage, ensuring data persists even if the service restarts. The database file is stored at the location specified in the ```.env``` file (defaults to ```database.sqlite``` in the project root).

## Rate Limiting

The API implements rate limiting to protect against abuse. 

- Global limit: 100 requests per 15 minutes (configurable)
- Item modification limit: 20 requests per 15 minutes for POST, PUT, DELETE operations (configurable)

Configure rate limiting in the .env file or `src/config/rateLimiter.ts` to modify defaults.

## Caching
The application includes a Redis-based caching layer that:

- Caches frequently accessed data to reduce database load
- Automatically invalidates cache when data changes
- Falls back to database access if cache is unavailable
- Can be disabled via environment variables

If Redis is not available, the application will automatically fall back to using the database directly without any disruption.

## License

MIT License