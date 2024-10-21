// src/middleware/proxy.ts

import express, { Response } from "express";
import { ClientRequest, IncomingMessage } from "http";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import ROUTE_PATHS from "../route-defs";
import { logRequest } from "../utils/logger";
import { gatewayLogger } from "../server";
import corsOptions from "../middleware/cors";
import { TLSSocket } from "tls";
import { Socket } from "net"; // Import Socket from the 'net' module

type ProxyConfig = {
  [context: string]: Options<IncomingMessage, Response>;
};

const proxyConfigs: ProxyConfig = {
  [ROUTE_PATHS.AUTH_SERVICE.path]: {
    target: ROUTE_PATHS.AUTH_SERVICE.target || "http://localhost:3000", // Provide a default value
    changeOrigin: true,
    pathRewrite: (path, _req) => {
      // Rewrite the incoming path to point to the correct target endpoint
      const rewrittenPath = path.replace("/api/v1/auth", "/cognito");
      console.log(`Rewriting path from ${path} to ${rewrittenPath}`);
      return rewrittenPath;
    },
    on: {
      proxyReq: (
        _proxyReq: ClientRequest,
        req: IncomingMessage,
        _res: Response
      ) => {
        const isSecure = (req.socket as TLSSocket).encrypted ? "https" : "http";

        const logInfo = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          protocol: isSecure,
          host: req.headers.host,
          path: req.url,
        };

        logRequest(gatewayLogger, logInfo);
      },
      proxyRes: (
        _proxyRes: IncomingMessage,
        _req: IncomingMessage,
        res: Response
      ) => {
        res.setHeader("Access-Control-Allow-Origin", corsOptions.origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
          "Access-Control-Allow-Methods",
          corsOptions.methods.join(", ")
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
      },
      error: (err: Error, req: IncomingMessage, res: Response | Socket) => {
        console.error(`Proxy error for ${req.url}:`, err.message);

        if ((res as Response).status) {
          (res as Response)
            .status(500)
            .send("Proxy encountered an error. Please try again later.");
        } else {
          (res as Socket).write(
            "Proxy encountered an error. Please try again later."
          );
          (res as Socket).end();
        }
      },
    },
  },
  [ROUTE_PATHS.PRODUCT_SERVICE.path]: {
    target: ROUTE_PATHS.PRODUCT_SERVICE.target || "http://localhost:3000",
    changeOrigin: true,
    pathRewrite: (path, _req) => {
      // Rewrite the incoming path to /v1/products
      const rewrittenPath = path.replace("/api/v1/product", "/v1/products");
      console.log(`Rewriting path from ${path} to ${rewrittenPath}`);
      return rewrittenPath;
    },
    on: {
      proxyReq: (
        _proxyReq: ClientRequest,
        req: IncomingMessage,
        _res: Response
      ) => {
        const isSecure = (req.socket as TLSSocket).encrypted ? "https" : "http";

        const logInfo = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          protocol: isSecure,
          host: req.headers.host,
          path: req.url,
        };

        logRequest(gatewayLogger, logInfo);
      },
      proxyRes: (
        _proxyRes: IncomingMessage,
        _req: IncomingMessage,
        res: Response
      ) => {
        res.setHeader("Access-Control-Allow-Origin", corsOptions.origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
          "Access-Control-Allow-Methods",
          corsOptions.methods.join(", ")
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
      },
      error: (err: Error, req: IncomingMessage, res: Response | Socket) => {
        console.error(`Proxy error for ${req.url}:`, err.message);

        if ((res as Response).status) {
          (res as Response)
            .status(500)
            .send("Proxy encountered an error. Please try again later.");
        } else {
          (res as Socket).write(
            "Proxy encountered an error. Please try again later."
          );
          (res as Socket).end();
        }
      },
    },
  },
};

const applyProxy = (app: express.Application) => {
  Object.keys(proxyConfigs).forEach((context: string) => {
    app.use(context, createProxyMiddleware(proxyConfigs[context]));
  });
};

export default applyProxy;
