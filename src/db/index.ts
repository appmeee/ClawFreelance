import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Generic error message to prevent information leakage
  throw new Error('Database configuration error');
}

// Validate connection string format without exposing it
const isValidConnectionString = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
};

if (!isValidConnectionString(connectionString)) {
  throw new Error('Invalid database configuration');
}

const isProduction = process.env.NODE_ENV === 'production';

// Create postgres client with hardened security settings
const client = postgres(connectionString, {
  // SSL Configuration
  // In production: verify server certificate
  // In development: disable SSL for local postgres
  ssl: isProduction ? { rejectUnauthorized: true } : false,

  // Connection Pool Settings
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,

  // Supavisor/PgBouncer compatibility (required for Supabase pooler)
  prepare: false,

  // Identify connections for audit trail in pg_stat_activity
  connection: {
    application_name: 'clawfreelance',
  },

  // Suppress server notices that could leak information
  onnotice: () => {},

  // Transform undefined to null for consistency
  transform: {
    undefined: null,
  },
});

// Graceful shutdown handler to prevent connection leaks
const cleanup = async () => {
  try {
    await client.end({ timeout: 5 });
  } catch {
    // Ignore cleanup errors during shutdown
  }
};

// Register cleanup on process termination (Node.js environment only)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
