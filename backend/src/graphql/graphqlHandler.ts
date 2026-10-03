import { buildSchema, graphql } from 'graphql';
import db from '../db/database';
import { Request, Response } from 'express';

const schema = buildSchema(`
  type User {
    id: String!
    name: String!
    email: String!
    role: String!
    avatarUrl: String
  }

  type JobHistory {
    id: String!
    jobId: String!
    previousStage: String
    newStage: String!
    previousStatus: String
    newStatus: String!
    changedBy: String!
    changeReason: String
    createdAt: String!
  }

  type Blocker {
    id: String!
    jobId: String!
    reason: String!
    status: String!
    createdBy: String!
    createdAt: String!
    resolvedBy: String
    resolvedAt: String
  }

  type Job {
    id: String!
    customerName: String!
    siteAddress: String!
    productType: String!
    assignedEngineer: String!
    assignedManager: String!
    currentStage: String!
    status: String!
    priority: String!
    createdAt: String!
    updatedAt: String!
    targetCompletionDate: String!
    blockerReason: String
    permitStatus: String!
    installationProgress: Int!
    estimatedHours: Float!
    actualHours: Float!
    history: [JobHistory]
    blockers: [Blocker]
  }

  type Alert {
    id: String!
    jobId: String!
    type: String!
    severity: String!
    message: String!
    status: String!
    createdAt: String!
    acknowledgedAt: String
    acknowledgedBy: String
  }

  type Metrics {
    totalRequests: Int!
    failedRequests: Int!
    successRate: Float!
    avgLatencyMs: Float!
    version: String!
  }

  type Query {
    jobs(status: String, priority: String, stage: String): [Job]
    job(id: String!): Job
    alerts(status: String): [Alert]
    users: [User]
    metrics: Metrics
  }
`);

const rootResolvers = {
  jobs: (args: { status?: string; priority?: string; stage?: string }) => {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];
    if (args.status) {
      query += ' AND status = ?';
      params.push(args.status);
    }
    if (args.priority) {
      query += ' AND priority = ?';
      params.push(args.priority);
    }
    if (args.stage) {
      query += ' AND currentStage = ?';
      params.push(args.stage);
    }
    query += ' ORDER BY createdAt DESC';
    return db.prepare(query).all(...params);
  },

  job: (args: { id: string }) => {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(args.id) as any;
    if (!job) return null;
    const history = db.prepare('SELECT * FROM job_history WHERE jobId = ? ORDER BY createdAt DESC').all(args.id);
    const blockers = db.prepare('SELECT * FROM blockers WHERE jobId = ? ORDER BY createdAt DESC').all(args.id);
    return { ...job, history, blockers };
  },

  alerts: (args: { status?: string }) => {
    if (args.status) {
      return db.prepare('SELECT * FROM alerts WHERE status = ? ORDER BY createdAt DESC').all(args.status);
    }
    return db.prepare('SELECT * FROM alerts ORDER BY createdAt DESC').all();
  },

  users: () => {
    return db.prepare('SELECT * FROM users').all();
  },

  metrics: () => {
    const summary = db.prepare(`
      SELECT
        COUNT(*) as totalRequests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedRequests,
        AVG(latencyMs) as avgLatencyMs
      FROM metrics
    `).get() as any;

    const totalReq = summary.totalRequests || 1;
    const failedReq = summary.failedRequests || 0;
    const successRate = Number((((totalReq - failedReq) / totalReq) * 100).toFixed(2));

    return {
      totalRequests: totalReq,
      failedRequests: failedReq,
      successRate,
      avgLatencyMs: Math.round(summary.avgLatencyMs || 45),
      version: 'v1.4.2-prod'
    };
  }
};

export async function handleGraphQLRequest(req: Request, res: Response) {
  const query = req.body.query || req.query.query;
  const variables = req.body.variables;

  if (!query) {
    return res.status(400).json({ errors: [{ message: 'No GraphQL query string provided' }] });
  }

  const result = await graphql({
    schema,
    source: query,
    rootValue: rootResolvers,
    variableValues: variables
  });

  return res.json(result);
}
