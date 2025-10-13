import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises";
import os from "os";

function getOrgFolder(org) {
  const base = path.join(os.homedir(), "Documents");
  if (org === "rohit") return path.join(base, "RE Invoices");
  if (org === "vighneshwar") return path.join(base, "VT Invoices");
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
      preload: path.join(process.cwd(), "electron", "preload.mjs"),
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
    const indexPath = path.join(process.cwd(), "dist", "spa", "index.html");
    await win.loadFile(indexPath);
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
