import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { importFromCSVFiles, saveImportedBudgetData } from "./services/csvImportService";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to log API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Add error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Import data from CSV files if they exist
  const csvDataDir = path.join(process.cwd(), 'data', 'budget');
  if (fs.existsSync(csvDataDir)) {
    try {
      // Check if there's an active budget period
      const activePeriod = await storage.getActiveBudgetPeriod();
      
      // Only import data if no active period exists
      if (!activePeriod) {
        log('No active budget period found. Importing data from CSV files...');
        const importResult = await importFromCSVFiles();
        
        if (importResult.success && importResult.data) {
          const saveResult = await saveImportedBudgetData(storage, importResult.data);
          log(`CSV Import result: ${saveResult.message}`);
        } else {
          log(`CSV Import failed: ${importResult.message}`);
        }
      } else {
        log('Active budget period found. Skipping CSV import.');
      }
    } catch (error) {
      log(`Error importing CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
