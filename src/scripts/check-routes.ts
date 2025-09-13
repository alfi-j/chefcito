#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

// Function to recursively find all route.ts files in the api directory
function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findRouteFiles(fullPath, fileList);
    } else if (item === 'route.ts') {
      fileList.push(fullPath);
    }
  });
  
  return fileList;
}

// Function to extract HTTP methods from a route file
function extractHttpMethods(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const methods: string[] = [];
  const methodRegex = /^(export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\b)/gm;
  
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[2]);
  }
  
  return methods;
}

// Main function to check all routes
async function checkRoutes() {
  console.log('🔍 Checking API routes...\n');
  
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  const routeFiles = findRouteFiles(apiDir);
  
  if (routeFiles.length === 0) {
    console.log('❌ No route files found in the API directory.');
    return;
  }
  
  console.log(`✅ Found ${routeFiles.length} route files:\n`);
  
  for (const file of routeFiles) {
    const relativePath = path.relative(apiDir, file);
    const methods = extractHttpMethods(file);
    
    console.log(`📁 ${relativePath}`);
    if (methods.length > 0) {
      console.log(`   🔄 Methods: ${methods.join(', ')}`);
    } else {
      console.log('   ⚠️  No HTTP methods found');
    }
    console.log();
  }
  
  console.log('✅ Route checking completed!');
}

// Run the check
checkRoutes().catch(console.error);