// src/app.ts

import express, { Request, Response } from "express";
import applyProxy from "./middleware/proxy"; // Updated path alias
import cookieParser from "cookie-parser";
import { authenticateToken, authorizeRole, routeConfigMiddleware } from "./middleware/auth"; // Updated path alias
import cors from "cors";
import corsOptions from "./middleware/cors"; // Updated path alias

// ========================
// Initialize App Express
// ========================//
const app = express();

// ========================
// Security Middleware
// ========================
app.use(cors(corsOptions));
app.use(cookieParser());

// ========================
// Gateway Health
// ========================
app.get("/v1/gateway-health", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "OK",
  });
});

// ========================
// Auth Middleware
// ========================
app.use(routeConfigMiddleware);
app.use(authenticateToken);
app.use(authorizeRole);

// =======================
// Proxy Routes
// =======================
applyProxy(app);

export default app;
