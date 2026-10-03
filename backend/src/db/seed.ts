import db, { initDb } from './database';

export function seedDatabase() {
  initDb();

  // Clear existing tables
  db.exec(`
    DELETE FROM job_notes;
    DELETE FROM alerts;
    DELETE FROM blockers;
    DELETE FROM job_history;
    DELETE FROM jobs;
    DELETE FROM users;
    DELETE FROM metrics;
  `);

  console.log('Seeding users...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, avatarUrl) VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    ['USR-001', 'Robert Sterling', 'robert.sterling@energyops.com', 'Admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'],
    ['USR-002', 'Amanda Torres', 'amanda.torres@energyops.com', 'Manager', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'],
    ['USR-003', 'Vikram Patel', 'vikram.patel@energyops.com', 'Manager', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'],
    ['USR-004', 'Elena Rostova', 'elena.rostova@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'],
    ['USR-005', 'Marcus Vance', 'marcus.vance@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'],
    ['USR-006', 'Sarah Jenkins', 'sarah.jenkins@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'],
    ['USR-007', 'David Chen', 'david.chen@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'],
    ['USR-008', 'Aisha Khan', 'aisha.khan@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150'],
    ['USR-009', 'Carlos Mendez', 'carlos.mendez@energyops.com', 'Engineer', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150']
  ];

  for (const u of users) {
    insertUser.run(u[0], u[1], u[2], u[3], u[4]);
  }

  console.log('Seeding 28 realistic energy installation jobs...');

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, customerName, siteAddress, productType, assignedEngineer, assignedManager,
      currentStage, status, priority, createdAt, updatedAt, targetCompletionDate,
      blockerReason, permitStatus, installationProgress, estimatedHours, actualHours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  const daysAhead = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();

  const jobsData = [
    {
      id: 'JOB-1001',
      customerName: 'AeroSpace Mfg HQ',
      siteAddress: '100 Innovation Way, Austin, TX 78701',
      productType: 'Commercial Solar',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'Installation',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(5),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 75,
      estimatedHours: 120,
      actualHours: 92
    },
    {
      id: 'JOB-1002',
      customerName: 'Cascadia Regional Hospital',
      siteAddress: '450 Healthcare Blvd, Seattle, WA 98104',
      productType: 'Microgrid System',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Robert Sterling',
      currentStage: 'Design Review',
      status: 'Blocked',
      priority: 'Critical',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(3),
      targetCompletionDate: daysAhead(12),
      blockerReason: 'Utility interconnect approval delayed by regional grid operator.',
      permitStatus: 'Revision Required',
      installationProgress: 20,
      estimatedHours: 240,
      actualHours: 85
    },
    {
      id: 'JOB-1003',
      customerName: 'Pinnacle Logistics Park',
      siteAddress: '88 Freight Depot Rd, Columbus, OH 43215',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Sarah Jenkins',
      assignedManager: 'Vikram Patel',
      currentStage: 'Completion',
      status: 'Completed',
      priority: 'Medium',
      createdAt: daysAgo(40),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAgo(2),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 100,
      estimatedHours: 90,
      actualHours: 86
    },
    {
      id: 'JOB-1004',
      customerName: 'Sun Valley Data Center',
      siteAddress: '1200 Power Line Dr, Phoenix, AZ 85001',
      productType: 'Industrial Battery Storage',
      assignedEngineer: 'David Chen',
      assignedManager: 'Amanda Torres',
      currentStage: 'Permit Submission',
      status: 'Delayed',
      priority: 'High',
      createdAt: daysAgo(25),
      updatedAt: daysAgo(4),
      targetCompletionDate: daysAhead(2),
      blockerReason: null,
      permitStatus: 'Submitted',
      installationProgress: 35,
      estimatedHours: 180,
      actualHours: 195
    },
    {
      id: 'JOB-1005',
      customerName: 'GreenLeaf Agribusiness',
      siteAddress: '330 Harvest Rd, Fresno, CA 93701',
      productType: 'Commercial Solar',
      assignedEngineer: 'Aisha Khan',
      assignedManager: 'Vikram Patel',
      currentStage: 'Site Assessment',
      status: 'In Progress',
      priority: 'Low',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(20),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 10,
      estimatedHours: 80,
      actualHours: 12
    },
    {
      id: 'JOB-1006',
      customerName: 'Titan Heavy Industries',
      siteAddress: '900 Steelworks Ave, Pittsburgh, PA 15201',
      productType: 'Industrial Wind Turbine',
      assignedEngineer: 'Carlos Mendez',
      assignedManager: 'Robert Sterling',
      currentStage: 'Inspection',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(4),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 90,
      estimatedHours: 310,
      actualHours: 295
    },
    {
      id: 'JOB-1007',
      customerName: 'Metro Transit Hub North',
      siteAddress: '55 Central Terminal, Chicago, IL 60601',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'Scheduling',
      status: 'In Progress',
      priority: 'Medium',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(14),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 45,
      estimatedHours: 110,
      actualHours: 40
    },
    {
      id: 'JOB-1008',
      customerName: 'Summit BioTech Campus',
      siteAddress: '700 Research Pkwy, Boston, MA 02110',
      productType: 'Microgrid System',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Robert Sterling',
      currentStage: 'Permit Approval',
      status: 'In Progress',
      priority: 'Critical',
      createdAt: daysAgo(18),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(10),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 30,
      estimatedHours: 260,
      actualHours: 90
    },
    {
      id: 'JOB-1009',
      customerName: 'Highland Ridge Estates',
      siteAddress: '42 Pine Crest Way, Denver, CO 80202',
      productType: 'Residential Battery Storage',
      assignedEngineer: 'Sarah Jenkins',
      assignedManager: 'Vikram Patel',
      currentStage: 'System Design',
      status: 'In Progress',
      priority: 'Low',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(18),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 15,
      estimatedHours: 45,
      actualHours: 8
    },
    {
      id: 'JOB-1010',
      customerName: 'Oceanic Cold Storage',
      siteAddress: '120 Dockside St, Miami, FL 33101',
      productType: 'Commercial Solar',
      assignedEngineer: 'David Chen',
      assignedManager: 'Amanda Torres',
      currentStage: 'Installation',
      status: 'Blocked',
      priority: 'High',
      createdAt: daysAgo(22),
      updatedAt: daysAgo(4),
      targetCompletionDate: daysAhead(3),
      blockerReason: 'Roof structural reinforce required before high-density array deployment.',
      permitStatus: 'Approved',
      installationProgress: 60,
      estimatedHours: 150,
      actualHours: 165
    },
    {
      id: 'JOB-1011',
      customerName: 'Vanguard Retail Plaza',
      siteAddress: '4400 Commerce Blvd, Atlanta, GA 30301',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Aisha Khan',
      assignedManager: 'Vikram Patel',
      currentStage: 'Completion',
      status: 'Completed',
      priority: 'Medium',
      createdAt: daysAgo(35),
      updatedAt: daysAgo(5),
      targetCompletionDate: daysAgo(5),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 100,
      estimatedHours: 95,
      actualHours: 92
    },
    {
      id: 'JOB-1012',
      customerName: 'Silverline Towers Complex',
      siteAddress: '880 Skyline Way, San Francisco, CA 94102',
      productType: 'Microgrid System',
      assignedEngineer: 'Carlos Mendez',
      assignedManager: 'Robert Sterling',
      currentStage: 'Design Review',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(15),
      blockerReason: null,
      permitStatus: 'Submitted',
      installationProgress: 25,
      estimatedHours: 200,
      actualHours: 45
    },
    {
      id: 'JOB-1013',
      customerName: 'Apex Data Vault 3',
      siteAddress: '500 Server Lane, Ashburn, VA 20147',
      productType: 'Industrial Battery Storage',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'Permit Submission',
      status: 'In Progress',
      priority: 'Critical',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(8),
      blockerReason: null,
      permitStatus: 'Submitted',
      installationProgress: 30,
      estimatedHours: 220,
      actualHours: 60
    },
    {
      id: 'JOB-1014',
      customerName: 'Horizon Auto Assembly',
      siteAddress: '12 Auto Park Rd, Detroit, MI 48201',
      productType: 'Commercial Solar',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Vikram Patel',
      currentStage: 'Site Assessment',
      status: 'Not Started',
      priority: 'Low',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(25),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 0,
      estimatedHours: 160,
      actualHours: 0
    },
    {
      id: 'JOB-1015',
      customerName: 'BlueSky Renewable Farm B',
      siteAddress: '77 Windmill Ridge, Lubbock, TX 79401',
      productType: 'Industrial Wind Turbine',
      assignedEngineer: 'Sarah Jenkins',
      assignedManager: 'Robert Sterling',
      currentStage: 'Installation',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(28),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(6),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 80,
      estimatedHours: 350,
      actualHours: 310
    },
    {
      id: 'JOB-1016',
      customerName: 'Crestview Senior Community',
      siteAddress: '310 Meadow Lane, Salt Lake City, UT 84101',
      productType: 'Residential Battery Storage',
      assignedEngineer: 'David Chen',
      assignedManager: 'Amanda Torres',
      currentStage: 'Completion',
      status: 'Completed',
      priority: 'Medium',
      createdAt: daysAgo(32),
      updatedAt: daysAgo(7),
      targetCompletionDate: daysAgo(7),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 100,
      estimatedHours: 65,
      actualHours: 60
    },
    {
      id: 'JOB-1017',
      customerName: 'Port of San Diego Fleet Hub',
      siteAddress: '1 Harbour Dr, San Diego, CA 92101',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Aisha Khan',
      assignedManager: 'Vikram Patel',
      currentStage: 'Permit Approval',
      status: 'Blocked',
      priority: 'Critical',
      createdAt: daysAgo(21),
      updatedAt: daysAgo(5),
      targetCompletionDate: daysAhead(1),
      blockerReason: 'Environmental impact study requested by coastal commission.',
      permitStatus: 'Revision Required',
      installationProgress: 35,
      estimatedHours: 190,
      actualHours: 120
    },
    {
      id: 'JOB-1018',
      customerName: 'Redwood Valley School District',
      siteAddress: '150 Education Way, Eureka, CA 95501',
      productType: 'Commercial Solar',
      assignedEngineer: 'Carlos Mendez',
      assignedManager: 'Robert Sterling',
      currentStage: 'Scheduling',
      status: 'In Progress',
      priority: 'Medium',
      createdAt: daysAgo(16),
      updatedAt: daysAgo(3),
      targetCompletionDate: daysAhead(11),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 50,
      estimatedHours: 130,
      actualHours: 55
    },
    {
      id: 'JOB-1019',
      customerName: 'Keystone Warehousing',
      siteAddress: '900 Logistics Blvd, Indianapolis, IN 46201',
      productType: 'Industrial Battery Storage',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'System Design',
      status: 'In Progress',
      priority: 'Low',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(22),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 18,
      estimatedHours: 140,
      actualHours: 25
    },
    {
      id: 'JOB-1020',
      customerName: 'Starlight Hotel & Resort',
      siteAddress: '200 Oceanfront Ave, Honolulu, HI 96815',
      productType: 'Microgrid System',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Vikram Patel',
      currentStage: 'Inspection',
      status: 'Delayed',
      priority: 'High',
      createdAt: daysAgo(38),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAgo(1),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 95,
      estimatedHours: 280,
      actualHours: 310
    },
    {
      id: 'JOB-1021',
      customerName: 'Beacon Hill Tower',
      siteAddress: '50 Beacon St, Seattle, WA 98144',
      productType: 'Residential Battery Storage',
      assignedEngineer: 'Sarah Jenkins',
      assignedManager: 'Robert Sterling',
      currentStage: 'Completion',
      status: 'Completed',
      priority: 'Low',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(10),
      targetCompletionDate: daysAgo(10),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 100,
      estimatedHours: 50,
      actualHours: 48
    },
    {
      id: 'JOB-1022',
      customerName: 'Ironclad Foundry West',
      siteAddress: '600 Industry Rd, Reno, NV 89501',
      productType: 'Microgrid System',
      assignedEngineer: 'David Chen',
      assignedManager: 'Amanda Torres',
      currentStage: 'Site Assessment',
      status: 'In Progress',
      priority: 'Medium',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(21),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 5,
      estimatedHours: 210,
      actualHours: 10
    },
    {
      id: 'JOB-1023',
      customerName: 'Liberty Tech Hub',
      siteAddress: '101 Freedom Blvd, Philadelphia, PA 19106',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Aisha Khan',
      assignedManager: 'Vikram Patel',
      currentStage: 'Design Review',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(16),
      blockerReason: null,
      permitStatus: 'Submitted',
      installationProgress: 22,
      estimatedHours: 115,
      actualHours: 28
    },
    {
      id: 'JOB-1024',
      customerName: 'Evergreen Thermal Plant',
      siteAddress: '88 Riverbank Rd, Portland, OR 97201',
      productType: 'Industrial Battery Storage',
      assignedEngineer: 'Carlos Mendez',
      assignedManager: 'Robert Sterling',
      currentStage: 'Installation',
      status: 'In Progress',
      priority: 'Critical',
      createdAt: daysAgo(25),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(4),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 65,
      estimatedHours: 290,
      actualHours: 210
    },
    {
      id: 'JOB-1025',
      customerName: 'Prism BioPharma Labs',
      siteAddress: '400 Genetics Way, Raleigh, NC 27601',
      productType: 'Commercial Solar',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'Permit Approval',
      status: 'In Progress',
      priority: 'Medium',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(2),
      targetCompletionDate: daysAhead(9),
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 40,
      estimatedHours: 140,
      actualHours: 45
    },
    {
      id: 'JOB-1026',
      customerName: 'Cascade Valley Winery',
      siteAddress: '780 Vineyard Lane, Napa, CA 94558',
      productType: 'Commercial Solar',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Vikram Patel',
      currentStage: 'Completion',
      status: 'Completed',
      priority: 'Low',
      createdAt: daysAgo(50),
      updatedAt: daysAgo(12),
      targetCompletionDate: daysAgo(12),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 100,
      estimatedHours: 105,
      actualHours: 98
    },
    {
      id: 'JOB-1027',
      customerName: 'Northern Lights Arena',
      siteAddress: '1200 Glacier Ave, Minneapolis, MN 55401',
      productType: 'EV Charging Hub',
      assignedEngineer: 'Sarah Jenkins',
      assignedManager: 'Robert Sterling',
      currentStage: 'Scheduling',
      status: 'In Progress',
      priority: 'High',
      createdAt: daysAgo(11),
      updatedAt: daysAgo(1),
      targetCompletionDate: daysAhead(13),
      blockerReason: null,
      permitStatus: 'Approved',
      installationProgress: 50,
      estimatedHours: 125,
      actualHours: 52
    },
    {
      id: 'JOB-1028',
      customerName: 'Solaria Solar Park West',
      siteAddress: '990 Desert Sun Highway, Las Vegas, NV 89101',
      productType: 'Commercial Solar',
      assignedEngineer: 'David Chen',
      assignedManager: 'Amanda Torres',
      currentStage: 'Permit Submission',
      status: 'Blocked',
      priority: 'Critical',
      createdAt: daysAgo(19),
      updatedAt: daysAgo(6),
      targetCompletionDate: daysAhead(3),
      blockerReason: 'Zoning variance requested by county land commissioner.',
      permitStatus: 'Revision Required',
      installationProgress: 30,
      estimatedHours: 260,
      actualHours: 110
    }
  ];

  for (const j of jobsData) {
    insertJob.run(
      j.id, j.customerName, j.siteAddress, j.productType, j.assignedEngineer, j.assignedManager,
      j.currentStage, j.status, j.priority, j.createdAt, j.updatedAt, j.targetCompletionDate,
      j.blockerReason, j.permitStatus, j.installationProgress, j.estimatedHours, j.actualHours
    );
  }

  console.log('Seeding job history...');
  const insertHistory = db.prepare(`
    INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let histId = 1;
  for (const j of jobsData) {
    insertHistory.run(
      `HIST-${histId++}`,
      j.id,
      'Site Assessment',
      j.currentStage,
      'Not Started',
      j.status,
      j.assignedEngineer,
      `Initial workflow progression to ${j.currentStage}`,
      j.createdAt
    );
  }

  console.log('Seeding active & resolved blockers...');
  const insertBlocker = db.prepare(`
    INSERT INTO blockers (id, jobId, reason, status, createdBy, createdAt, resolvedBy, resolvedAt, resolutionNotes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBlocker.run(
    'BLK-501',
    'JOB-1002',
    'Utility interconnect approval delayed by regional grid operator.',
    'Active',
    'Marcus Vance',
    daysAgo(3),
    null,
    null,
    null
  );

  insertBlocker.run(
    'BLK-502',
    'JOB-1010',
    'Roof structural reinforce required before high-density array deployment.',
    'Active',
    'David Chen',
    daysAgo(4),
    null,
    null,
    null
  );

  insertBlocker.run(
    'BLK-503',
    'JOB-1017',
    'Environmental impact study requested by coastal commission.',
    'Active',
    'Aisha Khan',
    daysAgo(5),
    null,
    null,
    null
  );

  insertBlocker.run(
    'BLK-504',
    'JOB-1028',
    'Zoning variance requested by county land commissioner.',
    'Active',
    'David Chen',
    daysAgo(6),
    null,
    null,
    null
  );

  insertBlocker.run(
    'BLK-505',
    'JOB-1001',
    'Custom inverter delivery delayed by manufacturer supply chain.',
    'Resolved',
    'Elena Rostova',
    daysAgo(10),
    'Amanda Torres',
    daysAgo(7),
    'Expedited replacement inverter shipment sourced from regional warehouse.'
  );

  console.log('Seeding operational alerts...');
  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, jobId, type, severity, message, status, createdAt, acknowledgedAt, acknowledgedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlert.run(
    'ALT-901',
    'JOB-1002',
    'Job Blocked > 24 Hours',
    'CRITICAL',
    'Job JOB-1002 has been blocked for 72 hours due to Utility Interconnect.',
    'Active',
    daysAgo(3),
    null,
    null
  );

  insertAlert.run(
    'ALT-902',
    'JOB-1004',
    'Target Date Overdue',
    'HIGH',
    'Job JOB-1004 target completion date is approaching in 48 hours with hours budget exceeded.',
    'Active',
    daysAgo(1),
    null,
    null
  );

  insertAlert.run(
    'ALT-903',
    'JOB-1017',
    'Permit Revision Overdue',
    'CRITICAL',
    'Job JOB-1017 permit approval requires immediate coastal impact study revision.',
    'Active',
    daysAgo(2),
    null,
    null
  );

  insertAlert.run(
    'ALT-904',
    'JOB-1004',
    'Actual Hours Threshold Exceeded',
    'MEDIUM',
    'Actual hours (195 hrs) exceed estimated budget (180 hrs) by 8.3%.',
    'Active',
    daysAgo(1),
    null,
    null
  );

  insertAlert.run(
    'ALT-905',
    'JOB-1003',
    'Completion Inspection Verified',
    'LOW',
    'Job JOB-1003 successfully completed final inspection and closeout signoff.',
    'Acknowledged',
    daysAgo(2),
    daysAgo(1),
    'Robert Sterling'
  );

  console.log('Seeding job notes...');
  const insertNote = db.prepare(`
    INSERT INTO job_notes (id, jobId, author, role, content, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNote.run('NTE-101', 'JOB-1001', 'Elena Rostova', 'Engineer', 'Rooftop mounting rails installed safely. Wiring connections 80% complete.', daysAgo(2));
  insertNote.run('NTE-102', 'JOB-1001', 'Amanda Torres', 'Manager', 'Client representative inspected array layout and approved next phase.', daysAgo(1));
  insertNote.run('NTE-103', 'JOB-1002', 'Marcus Vance', 'Engineer', 'Submitted revised grid protection relay schematics to municipal utility board.', daysAgo(3));

  console.log('Seeding initial system metrics...');
  const insertMetric = db.prepare(`
    INSERT INTO metrics (id, timestamp, latencyMs, statusCode, endpoint, success)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const endpoints = ['/api/jobs', '/api/jobs/JOB-1001', '/api/alerts', '/api/metrics', '/api/jobs/JOB-1002/stage'];
  for (let i = 1; i <= 40; i++) {
    const ep = endpoints[i % endpoints.length];
    const isErr = i % 15 === 0;
    insertMetric.run(
      `MTR-${1000 + i}`,
      daysAgo(i * 0.1),
      Math.floor(20 + Math.random() * 80 + (isErr ? 250 : 0)),
      isErr ? 500 : 200,
      ep,
      isErr ? 0 : 1
    );
  }

  console.log('Database seeded successfully with 28 jobs, users, history, blockers, alerts, and metrics!');
}

if (require.main === module) {
  seedDatabase();
}
