
import { promises as fs } from 'fs';
import path from 'path';

// This is a server-side only utility module.
// Do not import it in client components.

const dataDir = path.join(process.cwd(), 'src', 'data');

// Simple in-memory cache
const cache: { [key: string]: any } = {};

export async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data;
  } catch (error) {
    console.error(`Error reading data file ${filename}:`, error);
    return [] as T;
  }
}

export async function writeData(filename: string, data: any): Promise<void> {
  const filePath = path.join(dataDir, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    // Invalidate cache for this file since we are using fs.readFile directly
  } catch (error) {
    console.error(`Error writing data file ${filename}:`, error);
    throw error;
  }
}

// Function to clear the entire cache if needed, e.g., for testing
export function clearCache() {
    for (const key in cache) {
        delete cache[key];
    }
}
