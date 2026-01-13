#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set Vite dev server URL for Electron
process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
process.env.ELECTRON_DEV = '1';

// Find electron executable
const isWindows = process.platform === 'win32';
const possiblePaths = [
  path.join(__dirname, 'node_modules', 'electron', 'dist', isWindows ? 'electron.exe' : 'electron'),
  path.join(__dirname, 'node_modules', '.bin', isWindows ? 'electron.cmd' : 'electron'),
  path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron'),
];

let electronPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    electronPath = p;
    console.log(`Found Electron at: ${electronPath}`);
    break;
  }
}

if (!electronPath) {
  console.error('Electron executable not found. Tried paths:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

// Spawn Electron with proper working directory
const electron = spawn(electronPath, ['.'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-warnings=ExperimentalWarning',
  },
});

electron.on('error', (err) => {
  console.error('Failed to start Electron:', err);
  process.exit(1);
});

electron.on('exit', (code) => {
  process.exit(code);
});
