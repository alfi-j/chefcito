
import { promises as fs } from 'fs';
import path from 'path';

// This is a server-side only utility module.
// Do not import it in client components.

const dataDir = path.join(process.cwd(), 'src', 'data');

export async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading data file ${filename}:`, error);
    // Depending on the use case, you might want to return a default value
    // or re-throw the error. For this mock setup, we'll return an empty array.
    return [] as T;
  }
}

export async function writeData(filename: string, data: any): Promise<void> {
  const filePath = path.join(dataDir, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing data file ${filename}:`, error);
    // Handle the error appropriately
    throw error;
  }
}
