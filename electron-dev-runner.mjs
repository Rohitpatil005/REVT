#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set Vite dev server URL for Electron
process.env.VITE_DEV_SERVER_URL = 'http://localhost:5174';
process.env.ELECTRON_DEV = '1';

// Find electron executable
const isWindows = process.platform === 'win32';
const electronExePath = path.join(__dirname, 'node_modules', 'electron', 'dist', isWindows ? 'electron.exe' : 'electron');

if (!fs.existsSync(electronExePath)) {
  console.error(`❌ Electron not found at: ${electronExePath}`);
  console.error('Please run: pnpm install');
  process.exit(1);
}

console.log(`✅ Found Electron at: ${electronExePath}`);
console.log(`✅ Dev server URL: http://localhost:5174`);

// Spawn Electron without arguments - it will look for the main entry point in package.json
// which is set to "electron/main.mjs"
const electron = spawn(electronExePath, ['.'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DEV_SERVER_URL: 'http://localhost:5174',
    ELECTRON_DEV: '1',
    NODE_ENV: 'development',
  },
});

electron.on('error', (err) => {
  console.error('❌ Failed to start Electron:', err.message);
  process.exit(1);
});

electron.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Electron exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Handle termination
process.on('SIGTERM', () => {
  electron.kill();
});

process.on('SIGINT', () => {
  electron.kill();
});
