import cors from "cors";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";  // we will rely on serveStatic for prod
import session from "express-session";
import { storage } from "./storage";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for development, allow localhost:3001 during dev
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : "http://localhost:3001",
  credentials: true
}));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "movie-recommender-secret",
  resave: false,
  saveUninitialized: false,
  store: new session.MemoryStore(),
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Logging
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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // 🟢 In development, use Vite dev server
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }
  // 🚀 In production, serve built frontend
  else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
