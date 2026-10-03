import express from 'express';
import cors from 'cors';
import db, { initDb } from './db/database';
import { seedDatabase } from './db/seed';
import jobsRouter from './routes/jobs';
import blockersRouter from './routes/blockers';
import alertsRouter from './routes/alerts';
import metricsRouter from './routes/metrics';
import { handleGraphQLRequest } from './graphql/graphqlHandler';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database & Seed if empty
initDb();
const jobCount = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }).count;
if (jobCount === 0) {
  console.log('Database empty. Running initial seed...');
  seedDatabase();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'EnergyOps Operations API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// REST API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/blockers', blockersRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/metrics', metricsRouter);

// GraphQL Bonus Endpoint
app.post('/graphql', handleGraphQLRequest);
app.get('/graphql', handleGraphQLRequest);

// Database seed reset endpoint (For demo/testing convenience)
app.post('/api/seed/reset', (req, res) => {
  seedDatabase();
  res.json({ success: true, message: 'Database re-seeded successfully with 28 realistic energy jobs!' });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json({ success: true, data: users });
});

// Centralized Error Handling
app.use(errorHandler);

// Start Server if direct execution
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚡ EnergyOps Operations Platform Backend running`);
    console.log(`👉 REST API: http://localhost:${PORT}/api/jobs`);
    console.log(`👉 GraphQL:  http://localhost:${PORT}/graphql`);
    console.log(`====================================================`);
  });
}

export default app;
