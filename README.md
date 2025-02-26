# El Dorado Item API

A RESTful API for performing CRUD operations on `Item` entities, built with Hapi.js, TypeORM, and TypeScript.

## Features

- Complete CRUD operations for Item entities (id, name, price)
- Persistent data storage with TypeORM and SQLite
- Input validation using Joi
- API documentation with Swagger
- Rate limiting for API protection
- E2E tests
- Postman collection for testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- VS Code with Remote - Containers extension (if using devcontainer)

### Installation

#### Option 1: Standard Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-folder>