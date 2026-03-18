import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Router imports – each module exposes an Express Router
// ---------------------------------------------------------------------------
// import executionRouter from "./modules/execution/routes";
// import capabilityRouter from "./modules/capability/routes";
// import processRouter from "./modules/process/routes";
// import currencyRouter from "./modules/currency/routes";
// import reportsRouter from "./modules/reports/routes";

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${_res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// ---------------------------------------------------------------------------
// Auth middleware – extracts user from Supabase JWT
// In development requests are allowed through even without a valid token.
// ---------------------------------------------------------------------------
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.warn("Auth warning:", error.message);
      }

      // Attach user to request for downstream handlers
      (req as any).user = user ?? null;
    } catch (err) {
      console.warn("Auth token verification failed:", err);
      (req as any).user = null;
    }
  } else {
    (req as any).user = null;
  }

  // Allow request through regardless – individual routes can enforce auth
  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Module routes
// Uncomment each line once the corresponding module router is implemented.
// ---------------------------------------------------------------------------
// app.use("/api", executionRouter);
// app.use("/api", capabilityRouter);
// app.use("/api", processRouter);
// app.use("/api", currencyRouter);
// app.use("/api", reportsRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ---------------------------------------------------------------------------
// Error handling middleware
// ---------------------------------------------------------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { message: err.message }),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Hypbit OMS API running on http://localhost:${PORT}`);
});

export default app;
