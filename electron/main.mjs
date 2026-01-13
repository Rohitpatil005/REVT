import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;

function getOrgFolder(org) {
  const base = path.join(os.homedir(), "Documents");
  if (org === "rohit") return path.join(base, "Invoice RE");
  if (org === "vighneshwar") return path.join(base, "Invoice VT");
  return path.join(base, "Invoices");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// Start the Express server for Electron production mode
async function startServer(port = 5173) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "..", "dist", "server", "node-build.mjs");

    console.log("[Electron] Starting server from:", serverPath);
    console.log("[Electron] Server exists:", fsSync.existsSync(serverPath));

    if (!fsSync.existsSync(serverPath)) {
      console.error("[Electron] Server file not found. Make sure to run 'npm run build' first.");
      reject(new Error("Server file not found at " + serverPath));
      return;
    }

    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: "production",
        ELECTRON_MODE: "true",
      },
      stdio: ["ignore", "pipe", "pipe"], // capture stdout and stderr
      detached: false,
    });

    if (!serverProcess) {
      reject(new Error("Failed to spawn server process"));
      return;
    }

    let serverStarted = false;

    // Capture stdout
    serverProcess.stdout.on("data", (data) => {
      const message = data.toString();
      console.log("[Server]", message);
      // Check if server has started
      if (message.includes("Running on") || message.includes("listening")) {
        serverStarted = true;
      }
    });

    // Capture stderr
    serverProcess.stderr.on("data", (data) => {
      console.error("[Server Error]", data.toString());
    });

    serverProcess.on("error", (error) => {
      console.error("[Electron] Server process error:", error);
      reject(error);
    });

    serverProcess.on("exit", (code, signal) => {
      console.warn(`[Electron] Server process exited with code ${code} and signal ${signal}`);
    });

    // Wait for server to start (check multiple times)
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/ping`, { timeout: 1000 });
        if (response.ok) {
          console.log(`[Electron] ✅ Server is running and responding`);
          clearInterval(checkInterval);
          resolve(serverPath);
          return;
        }
      } catch (e) {
        // Server not ready yet
      }

      if (attempts > 20) {
        // Give up after 10 seconds
        console.warn(`[Electron] Server didn't respond in time, proceeding anyway`);
        clearInterval(checkInterval);
        resolve(serverPath);
      }
    }, 500);
  });
}

// Stop the server when app closes
function stopServer() {
  if (serverProcess) {
    console.log("Stopping server...");
    serverProcess.kill();
    serverProcess = null;
  }
}

async function createWindow() {
  const iconPath = path.join(__dirname, "..", "public", "favicon.ico");
  const preloadPath = path.join(__dirname, "preload.mjs");

  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fsSync.existsSync(preloadPath));

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: fsSync.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Add error handlers for debugging
  win.webContents.on("crashed", () => {
    console.error("Renderer process crashed");
  });

  win.webContents.on("render-process-gone", (event, details) => {
    console.error("Render process gone:", details);
  });

  win.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}] ${sourceId}:${line} - ${message}`);
  });

  const isDev =
    process.env.ELECTRON_DEV || process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log("App mode: DEVELOPMENT");
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    console.log("Loading dev URL:", devUrl);
    try {
      await win.loadURL(devUrl);
      win.webContents.openDevTools();
    } catch (e) {
      console.error("Failed to load dev URL:", e);
    }
  } else {
    // In production, run local Express server and load from localhost
    console.log("[Electron] App mode: PRODUCTION");
    try {
      console.log("[Electron] Starting Express server...");
      const port = 5173;
      await startServer(port);
      console.log("[Electron] Server started successfully");

      const localUrl = `http://127.0.0.1:${port}`;
      console.log("[Electron] Loading URL:", localUrl);
      await win.loadURL(localUrl);

      console.log("[Electron] ✅ App loaded successfully");

      // Only open dev tools if explicitly requested
      if (process.env.ELECTRON_DEBUG) {
        console.log("[Electron] Opening dev tools (ELECTRON_DEBUG enabled)");
        win.webContents.openDevTools();
      }
    } catch (e) {
      console.error("[Electron] Failed to start server or load app:", e);
      // Show error to user
      const errorHtml = `
        <html>
          <head>
            <style>
              body { font-family: system-ui; padding: 20px; background: #fee; color: #c00; }
              h1 { margin-top: 0; }
              pre { background: #fdd; padding: 10px; overflow: auto; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>❌ Failed to start application</h1>
            <p><strong>Error:</strong> ${e.message}</p>
            <p><strong>Steps to fix:</strong></p>
            <ol>
              <li>Make sure you ran <code>npm run build</code> before packaging</li>
              <li>Uninstall the current version</li>
              <li>Run <code>npm run electron:build:nsis</code> to create a new installer</li>
              <li>Install the new version</li>
            </ol>
            <details>
              <summary>Full error details</summary>
              <pre>${e.stack}</pre>
            </details>
          </body>
        </html>
      `;
      await win.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
    }
  }
}

app.whenReady().then(() => {
  ipcMain.handle("save-pdf", async (_evt, { org, fileName, arrayBuffer }) => {
    const folder = getOrgFolder(org);
    await ensureDir(folder);
    const fullPath = path.join(folder, fileName);
    const buf = Buffer.from(arrayBuffer);
    await fs.writeFile(fullPath, buf);
    return { fullPath };
  });

  ipcMain.handle("read-file", async (_evt, { fullPath }) => {
    const buf = await fs.readFile(fullPath);
    return { base64: buf.toString("base64") };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

// Clean up server on app quit
app.on("quit", () => {
  stopServer();
});
