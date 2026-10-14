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
import { authenticate, requireAuth, requireRole, generateToken, AuthUser } from './middleware/authMiddleware';

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
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:8501',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8501'
    ];
    if (allowed.includes(origin) || origin.endsWith('.streamlit.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Role', 'X-User-Name']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);
app.use(authenticate);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'EnergyOps Operations API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Authentication Token Issuance Endpoint
app.post('/api/auth/token', (req, res, next) => {
  try {
    const { role = 'Engineer', name = 'Test User', email = 'user@energyops.internal' } = req.body;
    if (!['Admin', 'Manager', 'Engineer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: [Admin, Manager, Engineer]'
      });
    }
    const user: AuthUser = {
      id: `USR-${role.toUpperCase()}-${Date.now()}`,
      name,
      email,
      role
    };
    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    next(err);
  }
});

// REST API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/blockers', blockersRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/metrics', metricsRouter);

// GraphQL Bonus Endpoint
app.post('/graphql', handleGraphQLRequest);
app.get('/graphql', handleGraphQLRequest);

// Database seed reset endpoint (Requires Admin role)
app.post('/api/seed/reset', requireAuth, requireRole('Admin'), (req, res) => {
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
