#!/usr/bin/env node

/**
 * Script to update packages to their latest versions
 * Usage: npx tsx update-packages.ts
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

async function updatePackages() {
  try {
    console.log('🔄 Updating all project packages...\n');
    
    // Update Next.js and React dependencies
    console.log('Updating Next.js and React dependencies...');
    execSync('npm install --save next@latest react@latest react-dom@latest', { stdio: 'inherit' });
    
    // Update UI component dependencies
    console.log('Updating UI component dependencies...');
    execSync('npm install --save @radix-ui/react-accordion@latest @radix-ui/react-alert-dialog@latest @radix-ui/react-avatar@latest @radix-ui/react-checkbox@latest @radix-ui/react-collapsible@latest @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest @radix-ui/react-label@latest @radix-ui/react-menubar@latest @radix-ui/react-popover@latest @radix-ui/react-progress@latest @radix-ui/react-radio-group@latest @radix-ui/react-scroll-area@latest @radix-ui/react-select@latest @radix-ui/react-separator@latest @radix-ui/react-slider@latest @radix-ui/react-slot@latest @radix-ui/react-switch@latest @radix-ui/react-tabs@latest @radix-ui/react-toast@latest @radix-ui/react-tooltip@latest', { stdio: 'inherit' });
    
    // Update other dependencies
    console.log('Updating other dependencies...');
    execSync('npm install --save class-variance-authority@latest clsx@latest cmdk@latest date-fns@latest embla-carousel-react@latest lucide-react@latest next-themes@latest recharts@latest sharp@latest sonner@latest', { stdio: 'inherit' });
    
    console.log('\n✅ All packages updated successfully!');
    console.log('\nPlease run "npm install" to ensure all dependencies are properly installed.');
  } catch (error) {
    console.error('❌ Error updating packages:', error);
    process.exit(1);
  }
}

updatePackages();