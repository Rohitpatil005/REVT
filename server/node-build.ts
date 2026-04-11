import path from "path";
import { createServer } from "./index";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = parseInt(process.env.PORT || "3000", 10);

// Create the Express app with API routes
const app = createServer();

console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[Server] Port: ${port}`);
console.log(`[Server] __dirname: ${__dirname}`);

// The SPA is built at: dist/server/../spa = dist/spa
const spaDir = path.join(__dirname, "..", "spa");
console.log(`[Server] SPA directory: ${spaDir}`);

// Check if spa files exist
import fs from "fs";
const indexPath = path.join(spaDir, "index.html");
console.log(`[Server] Checking for index.html at: ${indexPath}`);
console.log(`[Server] Index.html exists: ${fs.existsSync(indexPath)}`);

// Serve static files from SPA directory
app.use("/", (req, res, next) => {
  // Skip static file serving for API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }
  // Let express.static handle it
  next();
});

// Import express to use static properly
import express from "express";
app.use(express.static(spaDir, {
  maxAge: "1h",
  etag: false
}));

// SPA fallback - serve index.html for non-API routes
app.use((req, res) => {
  // Don't serve index.html for API routes (they should 404 above)
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  console.log(`[Server] Serving index.html for: ${req.path}`);
  res.sendFile(indexPath);
});

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`✅ [Server] Running on http://127.0.0.1:${port}`);
  console.log(`✅ [Server] Frontend: http://127.0.0.1:${port}`);
  console.log(`✅ [Server] API: http://127.0.0.1:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 [Server] Received SIGTERM, shutting down gracefully");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("🛑 [Server] Received SIGINT, shutting down gracefully");
  server.close(() => process.exit(0));
});
