// src/server.ts

import configs from "./configs"; // Updated path alias
import app from "./app"; // Updated path alias
import createLogger from "./utils/logger"; // Updated path alias

// Create the logger instance
export const gatewayLogger = createLogger({
  service: "api-gateway",
  level: "info",
  logGroupName: configs.awsCloudwatchLogsGroupName || "default-log-group-name",
});

console.log("App instance:", app)

async function run() {
  try {
    if (!app) {
      throw new Error("The Express app is not initialized properly.");
    }
    app.listen(configs.port, () => {
      console.log(`Gateway Service running on Port:`, configs.port);
    });
  } catch (error) {
    console.error("Failed to start the application:", error);
    process.exit(1);
  }
}

run();
