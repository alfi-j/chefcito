// This is a server-side only utility module.
// Do not import it in client components.

// All data operations now go directly to the database
// File-based fallback has been removed

export async function readData<T>(filename: string): Promise<T> {
  // All data operations now go directly to the database
  // This function is kept for compatibility but should not be used
  throw new Error('File-based data operations are no longer supported. Use database queries directly.');
}

export async function writeData(filename: string, data: any): Promise<void> {
  // All data operations now go directly to the database
  // This function is kept for compatibility but should not be used
  throw new Error('File-based data operations are no longer supported. Use database queries directly.');
}

// Function to clear the entire cache if needed, e.g., for testing
export function clearCache() {
  // No-op as we're not using file-based caching anymore
}