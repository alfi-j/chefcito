import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the project root
const envPath = path.join(__dirname, '../../.env.local');
console.log('Loading env from:', envPath);

dotenv.config({ path: envPath });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL value:', process.env.DATABASE_URL.substring(0, 50) + '...');
}