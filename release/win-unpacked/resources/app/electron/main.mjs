import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getOrgFolder(org) {
  const base = path.join(os.homedir(), "Documents");
  if (org === "rohit") return path.join(base, "Invoice RE");
  if (org === "vighneshwar") return path.join(base, "Invoice VT");
  return path.join(base, "Invoices");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function createWindow() {
  const iconPath = path.join(__dirname, "..", "public", "favicon.ico");
  const preloadPath = path.join(__dirname, "preload.js");

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
      sandbox: false,
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

  // Load from dev server if available, otherwise from production files (offline support)
  if (process.env.ELECTRON_DEV_SERVER === "1") {
    const devUrl = "http://localhost:5173";
    console.log("[Electron] Dev mode enabled. Attempting to load from:", devUrl);

    try {
      // Try to load from dev server with a timeout
      await Promise.race([
        win.loadURL(devUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Dev server timeout")), 5000)
        )
      ]);
      console.log("[Electron] ✅ Loaded from dev server (hot reload enabled)");
      console.log("[Electron] Opening DevTools for debugging...");
      win.webContents.openDevTools();
      return; // Success, exit early
    } catch (devError) {
      console.warn("[Electron] Dev server not available:", devError.message);
      console.log("[Electron] Falling back to production files for offline support...");
    }
  }

  // Load from production files (offline support - works without dev server)
  console.log("[Electron] Loading from production files (offline mode)");
  await loadProductionApp(win);
}

async function loadProductionApp(win) {
  try {
    console.log("[Electron] App mode: OFFLINE (loading from local HTTP server)");

    // Find the SPA directory
    let spaDir = null;
    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;

    const possibleDirs = [
      path.join(resourcesPath, "dist", "spa"),
      path.join(appPath, "dist", "spa"),
      path.join(__dirname, "..", "dist", "spa"),
      path.join(__dirname, "..", "..", "dist", "spa"),
    ];

    for (const dir of possibleDirs) {
      if (fsSync.existsSync(path.join(dir, "index.html"))) {
        spaDir = dir;
        console.log("[Electron] ✓ Found SPA directory at:", spaDir);
        break;
      }
    }

    if (!spaDir) {
      throw new Error(
        "Built SPA files not found. Please ensure dist/spa/index.html exists.\n" +
        "Checked paths:\n" + possibleDirs.join("\n")
      );
    }

    // Start a local HTTP server to serve the SPA
    // This enables service workers and provides better offline support
    const staticServe = (filePath, res) => {
      const fullPath = path.join(spaDir, filePath);

      // Prevent directory traversal
      if (!fullPath.startsWith(spaDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      try {
        const stat = fsSync.statSync(fullPath);

        if (stat.isDirectory()) {
          // Serve index.html for directories
          const indexPath = path.join(fullPath, "index.html");
          if (fsSync.existsSync(indexPath)) {
            const content = fsSync.readFileSync(indexPath, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(content);
          } else {
            res.writeHead(404);
            res.end("Not Found");
          }
        } else {
          // Serve the file
          const content = fsSync.readFileSync(fullPath);
          const ext = path.extname(fullPath);
          const mimeTypes = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".ico": "image/x-icon",
          };
          const contentType = mimeTypes[ext] || "application/octet-stream";

          res.writeHead(200, { "Content-Type": contentType });
          res.end(content);
        }
      } catch (err) {
        res.writeHead(404);
        res.end("Not Found");
      }
    };

    const server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Handle API routes
      if (req.url.startsWith("/api/")) {
        if (req.url === "/api/save-pdf" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", async () => {
            try {
              const { org, fileName, pdfData } = JSON.parse(body);
              if (!org || !fileName || !pdfData) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing required fields" }));
                return;
              }

              const folder = getOrgFolder(org);
              await ensureDir(folder);
              const fullPath = path.join(folder, fileName);
              const buffer = Buffer.from(pdfData, "base64");
              await fs.writeFile(fullPath, buffer);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                success: true,
                message: "PDF saved successfully",
                path: fullPath,
                fileName,
                org,
              }));
            } catch (error) {
              console.error("[offline-api] Error saving PDF:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                error: "Failed to save PDF",
                details: error instanceof Error ? error.message : String(error),
              }));
            }
          });
          return;
        }

        // Other API routes not found
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API route not found" }));
        return;
      }

      // Serve static files
      const filePath = req.url === "/" ? "/index.html" : req.url;
      staticServe(filePath, res);
    });

    // Find available port starting from 3000
    let port = 3000;
    const server_listen = () => {
      return new Promise((resolve, reject) => {
        server.listen(port, "127.0.0.1", () => {
          resolve(port);
        }).on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            port++;
            server_listen().then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });
      });
    };

    port = await server_listen();
    const localUrl = `http://127.0.0.1:${port}`;
    console.log("[Electron] ✅ Local HTTP server started at:", localUrl);

    // Load the app from local server (service workers will work properly)
    await win.loadURL(localUrl);
    console.log("[Electron] ✅ App loaded successfully with service worker support");

    // Only open dev tools if explicitly requested
    if (process.env.ELECTRON_DEBUG) {
      console.log("[Electron] Opening dev tools (ELECTRON_DEBUG enabled)");
      win.webContents.openDevTools();
    }
  } catch (e) {
    console.error("[Electron] Failed to load app:", e);
    const errorHtml = `
      <html>
        <head>
          <style>
            body { font-family: system-ui; padding: 20px; background: #fee; color: #c00; }
            h1 { margin-top: 0; }
            pre { background: #fdd; padding: 10px; overflow: auto; white-space: pre-wrap; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>❌ Failed to start application</h1>
          <p><strong>Error:</strong> ${e.message}</p>
          <p><strong>Steps to fix:</strong></p>
          <ol>
            <li>Run <code>npm run build</code> to create the SPA files</li>
            <li>Run <code>npm run electron:build:nsis</code> to create installer</li>
            <li>Restart the app</li>
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

function tryListDir(dirPath) {
  try {
    if (fsSync.existsSync(dirPath)) {
      return fsSync.readdirSync(dirPath).slice(0, 10).join(", ");
    }
    return "Directory does not exist";
  } catch (err) {
    return "Error reading directory: " + err.message;
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
  if (process.platform !== "darwin") app.quit();
});
