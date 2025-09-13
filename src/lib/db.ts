import { Pool, QueryResult } from 'pg';

// Only load .env file if not already in a Next.js environment
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  import('dotenv').then(dotenv => dotenv.config());
}

// Create a PostgreSQL connection pool
let pool: Pool | null = null;

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, database operations will not work');
    return null;
  }
  
  try {
    return new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('Error creating database pool:', error);
    return null;
  }
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('Database pool not available. Check your DATABASE_URL environment variable.');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  try {
    // Only initialize if we have a database URL
    if (!process.env.DATABASE_URL) {
      console.log('Skipping database initialization: DATABASE_URL not set');
      return;
    }
    
    console.log('Initializing database...');
    
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_modifier_group BOOLEAN DEFAULT false,
        linked_modifiers TEXT[],
        parent_id INTEGER
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        available BOOLEAN DEFAULT true,
        category VARCHAR(255),
        image_url VARCHAR(255),
        ai_hint TEXT,
        linked_modifiers TEXT[],
        sort_index INTEGER
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        table_number INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        is_pinned BOOLEAN DEFAULT false,
        customer_id VARCHAR(255),
        staff_name VARCHAR(255),
        status_history JSONB,
        notes TEXT,
        order_type VARCHAR(50) NOT NULL,
        delivery_info JSONB
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(255) PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        menu_item_id VARCHAR(255) REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        new_count INTEGER DEFAULT 0,
        cooking_count INTEGER DEFAULT 0,
        ready_count INTEGER DEFAULT 0,
        served_count INTEGER DEFAULT 0,
        selected_extras JSONB,
        split_id INTEGER,
        notes TEXT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        banks TEXT[]
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50),
        reorder_threshold DECIMAL(10, 2),
        last_restocked TIMESTAMP,
        linked_item_ids TEXT[],
        category VARCHAR(255)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50),
        status VARCHAR(50)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assignee_id VARCHAR(255) REFERENCES staff(id),
        reporter_id VARCHAR(255) REFERENCES staff(id),
        status VARCHAR(50),
        priority VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database on first import only in development
if (process.env.NODE_ENV !== 'production') {
  // Don't auto-initialize to prevent errors during import
  // initializeDatabase will be called manually when needed
}