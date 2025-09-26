#!/usr/bin/env tsx

/**
 * Script to update packages to their latest versions
 * Usage: npx tsx update-packages.ts
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('Updating packages to their latest versions...\n');

try {
  // Update root package.json dependencies
  console.log('Updating root dependencies...');
  execSync('npm install --save @neondatabase/serverless@latest', { stdio: 'inherit' });
  
  // Update root devDependencies
  console.log('Updating root devDependencies...');
  execSync('npm install --save-dev typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest', { stdio: 'inherit' });
  
  // Update Next.js and related packages
  console.log('Updating Next.js and related packages...');
  execSync('npm install --save next@latest react@latest react-dom@latest', { stdio: 'inherit' });
  execSync('npm install --save-dev eslint-config-next@latest', { stdio: 'inherit' });
  
  // Update Tailwind and related packages
  console.log('Updating Tailwind and related packages...');
  execSync('npm install --save tailwindcss@latest tailwind-merge@latest tailwindcss-animate@latest', { stdio: 'inherit' });
  execSync('npm install --save-dev autoprefixer@latest postcss@latest', { stdio: 'inherit' });
  
  // Update Radix UI components
  console.log('Updating Radix UI components...');
  execSync('npm install --save @radix-ui/react-accordion@latest @radix-ui/react-alert-dialog@latest @radix-ui/react-avatar@latest @radix-ui/react-checkbox@latest @radix-ui/react-collapsible@latest @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest @radix-ui/react-label@latest @radix-ui/react-menubar@latest @radix-ui/react-popover@latest @radix-ui/react-progress@latest @radix-ui/react-radio-group@latest @radix-ui/react-scroll-area@latest @radix-ui/react-select@latest @radix-ui/react-separator@latest @radix-ui/react-slider@latest @radix-ui/react-slot@latest @radix-ui/react-switch@latest @radix-ui/react-tabs@latest @radix-ui/react-toast@latest @radix-ui/react-tooltip@latest', { stdio: 'inherit' });
  
  // Update other dependencies
  console.log('Updating other dependencies...');
  execSync('npm install --save class-variance-authority@latest clsx@latest cmdk@latest date-fns@latest embla-carousel-react@latest lucide-react@latest next-themes@latest recharts@latest sharp@latest sonner@latest', { stdio: 'inherit' });
  
  // Update scripts package.json
  console.log('Updating scripts dependencies...');
  execSync('cd scripts && npm install --save @neondatabase/serverless@latest', { stdio: 'inherit' });
  execSync('cd scripts && npm install --save-dev typescript@latest @types/node@latest tsx@latest', { stdio: 'inherit' });
  
  console.log('\n✅ All packages updated successfully!');
  console.log('\nPlease run "npm install" to ensure all dependencies are properly installed.');
  
} catch (error) {
  console.error('❌ Error updating packages:', error);
  process.exit(1);
}