import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../energyops.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  const candidatePaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../../src/db/schema.sql'),
    path.join(process.cwd(), 'src/db/schema.sql'),
    path.join(process.cwd(), 'backend/src/db/schema.sql')
  ];
  const schemaPath = candidatePaths.find(p => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`schema.sql not found in candidate paths: ${candidatePaths.join(', ')}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

export default db;
