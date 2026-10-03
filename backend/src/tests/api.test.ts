import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import db, { initDb } from '../db/database';
import { seedDatabase } from '../db/seed';

beforeAll(() => {
  initDb();
  seedDatabase();
});

describe('EnergyOps Backend REST & GraphQL API Integration Tests', () => {
  
  it('1. GET /api/jobs - should return list of jobs with pagination metadata', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(25);
  });

  it('2. GET /api/jobs?status=In Progress - should filter jobs by status', async () => {
    const res = await request(app).get('/api/jobs?status=In Progress');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((job: any) => {
      expect(job.status).toBe('In Progress');
    });
  });

  it('3. GET /api/jobs/:id - should return single job detail with history & blockers', async () => {
    const res = await request(app).get('/api/jobs/JOB-1001');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('JOB-1001');
    expect(res.body.data.customerName).toBe('AeroSpace Mfg HQ');
    expect(Array.isArray(res.body.data.history)).toBe(true);
  });

  it('4. POST /api/jobs - should create a new energy installation job', async () => {
    const newJob = {
      customerName: 'Test Energy Grid LLC',
      siteAddress: '123 Solar Way, Denver, CO',
      productType: 'Commercial Solar',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      priority: 'High',
      estimatedHours: 150
    };

    const res = await request(app).post('/api/jobs').send(newJob);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customerName).toBe('Test Energy Grid LLC');
    expect(res.body.data.currentStage).toBe('Site Assessment');
  });

  it('5. PATCH /api/jobs/:id/stage - should allow valid sequential stage transition', async () => {
    // JOB-1005 is at Site Assessment
    const res = await request(app)
      .patch('/api/jobs/JOB-1005/stage')
      .send({
        newStage: 'System Design',
        userRole: 'Engineer',
        userName: 'Aisha Khan'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.currentStage).toBe('System Design');
  });

  it('6. PATCH /api/jobs/:id/stage - should reject invalid non-sequential stage transition', async () => {
    // Trying to skip from System Design straight to Completion without Admin override
    const res = await request(app)
      .patch('/api/jobs/JOB-1005/stage')
      .send({
        newStage: 'Completion',
        userRole: 'Engineer',
        userName: 'Aisha Khan'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_STAGE_TRANSITION');
  });

  it('7. POST /api/jobs/:id/blockers - should flag job as blocked with reason', async () => {
    const res = await request(app)
      .post('/api/jobs/JOB-1007/blockers')
      .send({
        reason: 'Transformer supply chain delay from vendor',
        createdBy: 'Elena Rostova'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Blocked');
    expect(res.body.data.blockerReason).toContain('Transformer supply chain delay');
  });

  it('8. PATCH /api/blockers/:id/resolve - should resolve blocker and unblock job', async () => {
    // BLK-501 belongs to JOB-1002
    const res = await request(app)
      .patch('/api/blockers/BLK-501/resolve')
      .send({
        resolvedBy: 'Robert Sterling',
        resolutionNotes: 'Interconnect agreement signed by regional utility board.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.job.status).toBe('In Progress');
  });

  it('9. GET /api/alerts - should return active operational alerts', async () => {
    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.summary.totalAlerts).toBeGreaterThan(0);
  });

  it('10. GET /api/metrics - should return latency and performance monitoring stats', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe('v1.4.2-prod');
    expect(res.body.data.successRate).toBeGreaterThan(0);
  });

  it('11. POST /graphql - should handle GraphQL bonus queries', async () => {
    const query = `
      query {
        jobs(status: "In Progress") {
          id
          customerName
          currentStage
          priority
        }
        metrics {
          totalRequests
          successRate
        }
      }
    `;

    const res = await request(app).post('/graphql').send({ query });
    expect(res.status).toBe(200);
    expect(res.body.data.jobs).toBeDefined();
    expect(res.body.data.metrics).toBeDefined();
  });
});
