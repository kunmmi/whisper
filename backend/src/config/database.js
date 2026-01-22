/**
 * Database configuration and initialization
 * Uses SQLite for MVP
 */

const Database = require('better-sqlite3');
const path = require('path');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Initialize database connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test connection
try {
  db.prepare('SELECT 1').run();
  console.log('Database connected successfully');
} catch (error) {
  console.error('Database connection error:', error);
  process.exit(1);
}

module.exports = db;

