#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = 'http://localhost:5173';
const DEV_SERVER_PORT = 5173;
const isWindows = process.platform === 'win32';

// Function to check if dev server is ready
function isServerReady(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Function to wait for dev server to be ready
async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    if (await isServerReady(DEV_SERVER_URL)) {
      console.log(`✅ Dev server is ready at ${DEV_SERVER_URL}`);
      return true;
    }
    console.log(`⏳ Waiting for dev server... (${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.error('❌ Dev server failed to start');
  return false;
}

// Find electron executable
const electronExePath = path.join(__dirname, 'node_modules', 'electron', 'dist', isWindows ? 'electron.exe' : 'electron');

if (!fs.existsSync(electronExePath)) {
  console.error(`❌ Electron not found at: ${electronExePath}`);
  console.error('Please run: pnpm install');
  process.exit(1);
}

console.log(`✅ Found Electron at: ${electronExePath}`);
console.log(`🚀 Starting Vite dev server on ${DEV_SERVER_URL}...`);

// Start Vite dev server first
// On Windows, we need to use shell: true to run npm commands
const viteProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: isWindows,
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});

// Wait for Vite to be ready, then start Electron
setTimeout(async () => {
  const ready = await waitForServer();

  if (ready) {
    console.log(`\n🔧 Starting Electron with dev server at ${DEV_SERVER_URL}...\n`);

    const electron = spawn(electronExePath, ['.'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        ELECTRON_DEV_SERVER: '1',
        NODE_ENV: 'development',
      },
    });

    electron.on('error', (err) => {
      console.error('❌ Failed to start Electron:', err.message);
      viteProcess.kill();
      process.exit(1);
    });

    electron.on('exit', (code) => {
      console.log(`\n✅ Electron closed`);
      viteProcess.kill();
      process.exit(code || 0);
    });

    // Handle termination
    const handleTerminate = () => {
      electron.kill();
      viteProcess.kill();
    };

    process.on('SIGTERM', handleTerminate);
    process.on('SIGINT', handleTerminate);
  } else {
    viteProcess.kill();
    process.exit(1);
  }
}, 1000);

// Handle Vite process errors
viteProcess.on('error', (err) => {
  console.error('❌ Failed to start Vite:', err.message);
  process.exit(1);
});
