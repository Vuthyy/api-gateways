import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import configs from "../configs"; // Ensure you have the configs file for AWS Cognito
import { jwtDecode } from "jwt-decode"; // Corrected import for jwtDecode
import axios from "axios";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "./errors"; // Import your custom errors
import ROUTE_PATHS, { RouteConfig } from "../route-defs";
import { JwtPayload } from "jwt-decode"; // Import default JwtPayload

// Define a custom interface extending JwtPayload
interface CustomJwtPayload extends JwtPayload {
  "cognito:username"?: string;
  "custom:role"?: string;
  "cognito:groups"?: string[]; // Optional: Based on your usage
}

declare global {
  namespace Express {
    interface Request {
      currentUser: {
        username: string;
        role: string[] | undefined;
      };
      routeConfig: RouteConfig;
      methodConfig: {
        authRequired: boolean;
        roles?: string[];
      };
    }
  }
}

// Cognito Verifier setup
const verifier = CognitoJwtVerifier.create({
  userPoolId: configs.awsCognitoUserPoolId,
  tokenUse: "access",
  clientId: configs.awsCognitoClientId,
});

// Find the route configuration for a given path
const findRouteConfig = (
  path: string,
  routeConfigs: RouteConfig
): RouteConfig | null => {
  const trimmedPath = path.replace(/\/+$/, ""); // Normalize path
  const requestSegments = trimmedPath.split("/").filter(Boolean);
  const routeSegments = routeConfigs.path.split("/").filter(Boolean);

  if (routeSegments.length > requestSegments.length) {
    return null;
  }

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const requestSegment = requestSegments[i];

    if (routeSegment.startsWith(":")) {
      continue; // Handle dynamic route parameters
    }

    if (routeSegment !== requestSegment) {
      return null;
    }
  }

  // Check if there are any nested routes that match
  if (routeConfigs.nestedRoutes) {
    const remainingPath = `/${requestSegments
      .slice(routeSegments.length)
      .join("/")}`;
    for (const nestedRouteConfig of routeConfigs.nestedRoutes) {
      const nestedResult = findRouteConfig(remainingPath, nestedRouteConfig);
      if (nestedResult) {
        return nestedResult;
      }
    }
  }

  // If no nested routes matched, return the main route config
  return routeConfigs;
};

// Middleware to set route and method configuration
const routeConfigMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { path, method } = req;
  let routeConfig: RouteConfig | null = null;

  console.log("Requested path:", path); // Debug log for requested path

  for (const key in ROUTE_PATHS) {
    routeConfig = findRouteConfig(path, ROUTE_PATHS[key]);
    if (routeConfig) break;
  }

  console.log("Matched routeConfig:", routeConfig); // Debug log for matched route configuration

  if (!routeConfig) {
    return next(new NotFoundError("Route not found"));
  }

  const methodConfig = routeConfig.methods?.[method];
  if (!methodConfig) {
    return next(new NotFoundError("Method not allowed"));
  }

  req.routeConfig = routeConfig;
  req.methodConfig = methodConfig;
  next();
};

// Authentication Middleware
const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const { methodConfig } = req;

    if (methodConfig.authRequired) {
      const token = req.cookies?.["access_token"];
      if (!token) {
        throw new AuthenticationError("Please login to continue");
      }

      const payload = await verifier.verify(token);
      if (!payload) {
        throw new AuthenticationError();
      }

      let role: string[] = [];
      const userPayload = jwtDecode<CustomJwtPayload>(
        req.cookies?.["id_token"]
      );

      if (userPayload["cognito:username"]?.includes("google")) {
        if (!userPayload["custom:role"]) {
          const { data } = await axios.get(
            `${configs.authServiceUrl}/v1/users/me`,
            {
              headers: { Cookie: `username=${userPayload.sub}` },
            }
          );
          role.push(data.data.role);
        } else {
          role.push(userPayload["custom:role"]!);
        }
      } else {
        role = payload["cognito:groups"] || [];
      }

      req.currentUser = {
        username: payload.username,
        role,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Authorization Middleware
const authorizeRole = (req: Request, _res: Response, next: NextFunction) => {
  const { methodConfig, currentUser } = req;

  if (methodConfig.roles) {
    if (
      !currentUser ||
      !Array.isArray(currentUser.role) ||
      !currentUser.role.some((role) => methodConfig.roles!.includes(role))
    ) {
      return next(new AuthorizationError());
    }
  }

  next();
};

export { authenticateToken, authorizeRole, routeConfigMiddleware };
