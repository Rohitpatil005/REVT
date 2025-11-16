import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getOrgFolder(org) {
  const base = path.join(os.homedir(), "Documents");
  if (org === "rohit") return path.join(base, "Invoice Re");
  if (org === "vighneshwar") return path.join(base, "Invoice VT");
  return path.join(base, "Invoices");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev =
    process.env.ELECTRON_DEV || process.env.NODE_ENV !== "production";
  if (isDev) {
    await win.loadURL(
      process.env.VITE_DEV_SERVER_URL || "http://localhost:5173",
    );
  } else {
    // In production, load from the built SPA files
    // When packaged with electron-builder, files are in dist/spa
    const indexPath = path.join(__dirname, "..", "dist", "spa", "index.html");
    if (fsSync.existsSync(indexPath)) {
      await win.loadFile(indexPath);
    } else {
      console.error("index.html not found at:", indexPath);
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
  if (process.platform !== "darwin") app.quit();
});
