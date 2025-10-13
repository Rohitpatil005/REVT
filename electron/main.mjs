import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

let mainWindow = null;

function getBaseInvoicesDir(org) {
  const docs = app.getPath("documents");
  const appDir = path.join(docs, "RohitBilling", org, "Invoices");
  return appDir;
}

function yearMonthFolder() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Rohit Billing Suite",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(app.getAppPath(), "electron", "preload.mjs"),
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  const devUrl = process.env.ELECTRON_START_URL || "http://localhost:5173";
  try {
    await mainWindow.loadURL(devUrl);
  } catch {
    const indexHtml = path.join(app.getAppPath(), "dist", "spa", "index.html");
    await mainWindow.loadFile(indexHtml);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.setAppUserModelId?.("com.rohit.billing");

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("save-invoice-pdf", async (_evt, { org, fileName, data }) => {
  if (!org || !fileName || !data) throw new Error("Missing required parameters");
  const base = path.join(getBaseInvoicesDir(org), yearMonthFolder());
  await fs.mkdir(base, { recursive: true });
  const filePath = path.join(base, fileName);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  return filePath;
});

ipcMain.handle("open-invoices-folder", async (_evt, { org }) => {
  const base = getBaseInvoicesDir(org || "General");
  await fs.mkdir(base, { recursive: true });
  await shell.openPath(base);
});
