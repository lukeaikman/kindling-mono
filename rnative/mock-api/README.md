# Kindling Mock API

This directory contains the JSON Server configuration for the Kindling mock API.

## Overview

The mock API provides a RESTful interface for development and testing before the Rails backend is ready. It uses the same data structures and endpoints that will be implemented in production.

## Setup

### Install JSON Server

```bash
npm install -g json-server
```

### Start the Mock API Server

```bash
# From the native-app directory
json-server --watch mock-api/db.json --routes mock-api/routes.json --port 3001

# Or use the npm script (when added to package.json)
npm run mock-api
```

## API Endpoints

All endpoints are prefixed with `/api/`

### Will Data

- `GET /api/will` - Get will data
- `PUT /api/will` - Update will data
- `PATCH /api/will` - Partial update will data

### People

- `GET /api/people` - Get all people
- `GET /api/people/:id` - Get person by ID
- `POST /api/people` - Create new person
- `PUT /api/people/:id` - Update person
- `PATCH /api/people/:id` - Partial update person
- `DELETE /api/people/:id` - Delete person

### Assets

- `GET /api/assets` - Get all assets (all categories)
- `GET /api/assets/:type` - Get assets by type (e.g., /api/assets/property)
- `POST /api/assets/:type` - Create asset of specific type
- `PUT /api/assets/:type/:id` - Update asset
- `DELETE /api/assets/:type/:id` - Delete asset

### Businesses

- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/:id` - Get business by ID
- `POST /api/businesses` - Create business
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### Trusts

- `GET /api/trusts` - Get all trusts
- `GET /api/trusts/:id` - Get trust by ID
- `POST /api/trusts` - Create trust
- `PUT /api/trusts/:id` - Update trust
- `DELETE /api/trusts/:id` - Delete trust

### Relationships

- `GET /api/relationships` - Get all relationship edges
- `GET /api/relationships/:id` - Get relationship by ID
- `POST /api/relationships` - Create relationship
- `PUT /api/relationships/:id` - Update relationship
- `DELETE /api/relationships/:id` - Delete relationship

### Beneficiary Groups

- `GET /api/beneficiary-groups` - Get all groups
- `GET /api/beneficiary-groups/:id` - Get group by ID
- `POST /api/beneficiary-groups` - Create group
- `PUT /api/beneficiary-groups/:id` - Update group
- `DELETE /api/beneficiary-groups/:id` - Delete group

### Estate Remainder

- `GET /api/estate-remainder` - Get estate remainder state
- `PUT /api/estate-remainder` - Update estate remainder state
- `PATCH /api/estate-remainder` - Partial update estate remainder

## Data Structure

See `db.json` for the complete data structure. The structure matches the TypeScript interfaces defined in `src/types/index.ts`.

## Migration to Rails

When the Rails backend is ready:

1. Implement the same endpoints in Rails controllers
2. Use the same JSON structure for requests/responses
3. Update the API base URL in the React Native app
4. Remove JSON Server dependency

The data structures are designed to be Rails-compatible, making the migration straightforward.

## Development Tips

- Use Postman or similar tools to test API endpoints
- Check `db.json` to see the current state of the mock data
- JSON Server auto-saves changes to `db.json`
- Restart server to reset to initial state
- Use query parameters for filtering (e.g., `/api/people?roles_like=beneficiary`)

## Notes

- JSON Server is for development only, not for production
- Data persists in `db.json` between server restarts
- Delete `db.json` to reset to initial state
- CORS is enabled by default for local development

