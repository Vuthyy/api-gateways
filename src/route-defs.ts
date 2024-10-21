// src/route-defs.ts

import configs from "../src/configs";

export interface RouteConfig {
  path: string;
  target?: string;
  methods?: {
    [method: string]: {
      authRequired: boolean;
      roles?: string[]; // Optional: Roles that are allowed
    };
  };
  nestedRoutes?: RouteConfig[];
}

export interface RoutesConfig {
  [route: string]: RouteConfig;
}

const ROUTE_PATHS: RoutesConfig = {
  AUTH_SERVICE: {
    path: "/api/v1/auth",
    target: configs.authServiceUrl,
    nestedRoutes: [
      {
        path: "/signup",
        methods: {
          POST: {
            authRequired: false,
          },
        },
      },
      {
        path: "/signin",
        methods: {
          POST: {
            authRequired: false,
          },
        },
      },
      {
        path: "/verify",
        methods: {
          POST: {
            authRequired: false,
          },
        },
      },
      {
        path: "/login",
        methods: {
          POST: {
            authRequired: false,
          },
        },
      },
      {
        path: "/google",
        methods: {
          GET: {
            authRequired: false,
          },
        },
      },
      {
        path: "/refresh-token",
        methods: {
          POST: {
            authRequired: false,
          },
        },
      },
      {
        path: "/oauth/callback",
        methods: {
          GET: {
            authRequired: false,
          },
        },
      },
    ],
  },
  PRODUCT_SERVICE: {
    path: "/api/v1/product",
    target: configs.productServiceUrl,
    methods: {
      GET: {
        authRequired: true,
        roles: ["admin", "user"], // Require roles for access
      },
      POST: {
        authRequired: true,
        roles: ["admin"], // Restrict POST access to admin only
      },
    },
    nestedRoutes: [
      {
        path: "/:id",
        methods: {
          GET: {
            authRequired: true,
            roles: ["admin", "user"],
          },
          PUT: {
            authRequired: true,
            roles: ["admin"],
          },
          DELETE: {
            authRequired: true,
            roles: ["admin"],
          },
        },
      },
    ],
  },
};

export default ROUTE_PATHS;
