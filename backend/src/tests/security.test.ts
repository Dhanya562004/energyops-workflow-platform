import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { initDb } from '../db/database';
import { seedDatabase } from '../db/seed';
import { generateToken, AuthUser } from '../middleware/authMiddleware';

beforeAll(() => {
  initDb();
  seedDatabase();
});

describe('Phase 5 Security & Authorization Tests', () => {
  const adminUser: AuthUser = {
    id: 'USR-ADMIN-1',
    name: 'Robert Sterling',
    email: 'robert.sterling@energyops.com',
    role: 'Admin'
  };

  const managerUser: AuthUser = {
    id: 'USR-MGR-1',
    name: 'Amanda Torres',
    email: 'amanda.torres@energyops.com',
    role: 'Manager'
  };

  const engineerUser: AuthUser = {
    id: 'USR-ENG-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@energyops.com',
    role: 'Engineer'
  };

  const adminToken = generateToken(adminUser);
  const managerToken = generateToken(managerUser);
  const engineerToken = generateToken(engineerUser);

  describe('1. Authentication & Token Verification', () => {
    it('should generate a signed JWT token via POST /api/auth/token', async () => {
      const res = await request(app)
        .post('/api/auth/token')
        .send({ role: 'Manager', name: 'Amanda Torres', email: 'amanda.torres@energyops.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.role).toBe('Manager');
    });

    it('should reject POST /api/auth/token with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/token')
        .send({ role: 'SuperUser', name: 'Hacker' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject protected mutation without token or credentials with 401', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          customerName: 'No Auth Solar',
          siteAddress: '123 Ghost Lane',
          productType: 'Commercial Solar',
          assignedEngineer: 'Ghost'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject malformed or invalid JWT bearer token with 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', 'Bearer invalid.tampered.token')
        .send({
          customerName: 'Tampered Token Solar',
          siteAddress: '123 Hack St',
          productType: 'Commercial Solar'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should authenticate via Streamlit service API Key (AQ.Ab...) without x-user-role header', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('x-api-key', 'AQ.Ab-ValidServiceKey-Streamlit')
        .send({
          customerName: 'Streamlit Service Co',
          siteAddress: '400 Cloud Way, San Francisco, CA',
          productType: 'Microgrid System',
          assignedEngineer: 'Marcus Vance',
          assignedManager: 'Amanda Torres',
          priority: 'High'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid API Key with 401 INVALID_API_KEY', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('x-api-key', 'INVALID-KEY-12345')
        .send({
          customerName: 'Unauthorized Corp',
          siteAddress: '100 Bad Token St'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should reject role bypass attempt via x-user-role header with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('x-user-role', 'Admin')
        .set('x-user-name', 'Attacker')
        .send({
          customerName: 'Bypass Co',
          siteAddress: '123 Fake Rd',
          productType: 'Commercial Solar',
          assignedEngineer: 'Elena Rostova',
          assignedManager: 'Amanda Torres'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject role bypass attempt via request body fields with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          userRole: 'Admin',
          customerName: 'Body Bypass Co',
          siteAddress: '123 Fake Rd',
          productType: 'Commercial Solar',
          assignedEngineer: 'Elena Rostova',
          assignedManager: 'Amanda Torres'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should prevent authenticated Engineer from escalating to Admin via body fields during stage override', async () => {
      const res = await request(app)
        .patch('/api/jobs/JOB-1001/stage')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          newStage: 'Completion',
          userRole: 'Admin',
          override: true,
          reason: 'Attempted privilege escalation via body'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ACTION');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should forbid Engineer from creating a new job contract (403 FORBIDDEN_ROLE)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          customerName: 'Engineer Created Solar',
          siteAddress: '999 Forbidden Rd',
          productType: 'Commercial Solar',
          assignedEngineer: 'Elena Rostova',
          assignedManager: 'Amanda Torres'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should allow Manager to create a new job contract (201 Created)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customerName: 'Manager Solar Grid',
          siteAddress: '789 Sun Blvd, Austin, TX',
          productType: 'EV Charging Hub',
          assignedEngineer: 'Marcus Vance',
          assignedManager: 'Amanda Torres',
          priority: 'High',
          estimatedHours: 120
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerName).toBe('Manager Solar Grid');
    });

    it('should forbid Engineer from resolving a blocker (403 FORBIDDEN_ROLE)', async () => {
      const res = await request(app)
        .patch('/api/blockers/BLK-501/resolve')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          resolutionNotes: 'Engineer trying to resolve blocker without manager signoff.'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should allow Manager to resolve a blocker (200 OK)', async () => {
      const res = await request(app)
        .patch('/api/blockers/BLK-501/resolve')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          resolutionNotes: 'Manager approved utility agreement.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid non-Admin from resetting database seed (403 FORBIDDEN_ROLE)', async () => {
      const res = await request(app)
        .post('/api/seed/reset')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should allow Admin to reset database seed (200 OK)', async () => {
      const res = await request(app)
        .post('/api/seed/reset')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('re-seeded successfully');
    });
  });

  describe('3. Input Validation Schemas', () => {
    it('should reject job creation when customerName is missing or too short', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customerName: 'A',
          siteAddress: '123 Solar Way',
          productType: 'Commercial Solar',
          assignedEngineer: 'Elena Rostova',
          assignedManager: 'Amanda Torres'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('customerName');
    });

    it('should reject job creation with unknown productType', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customerName: 'Valid Customer Name',
          siteAddress: '123 Valid Site Address',
          productType: 'Nuclear Fusion Reactor',
          assignedEngineer: 'Elena Rostova',
          assignedManager: 'Amanda Torres'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('productType');
    });

    it('should reject stage transition with invalid stage name', async () => {
      const res = await request(app)
        .patch('/api/jobs/JOB-1001/stage')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          newStage: 'Arbitrary Stage 99'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject status update to Blocked without blockerReason', async () => {
      const res = await request(app)
        .patch('/api/jobs/JOB-1001/status')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          status: 'Blocked'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('blockerReason');
    });

    it('should reject blocker creation with empty or short reason', async () => {
      const res = await request(app)
        .post('/api/jobs/JOB-1001/blockers')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          reason: 'bad'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
