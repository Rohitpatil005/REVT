import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import { handleSavePdf } from "./routes/savePdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // PDF save endpoint
  app.post("/api/save-pdf", handleSavePdf);

  // Serve static SPA files from dist/spa (for Electron in production)
  const spaDir = path.join(__dirname, "..", "dist", "spa");
  app.use(express.static(spaDir));

  // SPA fallback: serve index.html for all non-API routes
  app.use((req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(spaDir, "index.html"));
  });

  return app;
}
