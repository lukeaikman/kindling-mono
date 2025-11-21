/**
 * JSON Server configuration for Kindling mock API
 * 
 * This server provides a mock REST API for development before the Rails backend is ready.
 * It uses the same data structures and API endpoints that will be used in production.
 * 
 * Usage:
 *   npm install -g json-server
 *   json-server --watch mock-api/db.json --routes mock-api/routes.json --port 3001
 * 
 * Or use the npm script:
 *   npm run mock-api
 */

const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('mock-api/db.json');
const middlewares = jsonServer.defaults();

// Use default middlewares (logger, static, cors, no-cache)
server.use(middlewares);

// Add custom middleware for logging
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add body parser
server.use(jsonServer.bodyParser);

// Custom routes before JSON Server router
server.use(jsonServer.rewriter({
  '/api/*': '/$1'
}));

// Use default router
server.use(router);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 JSON Server is running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`📊 Database file: mock-api/db.json`);
});

