// src/configs.ts

import dotenv from "dotenv";
import path from "path";
import Joi from "joi";

// Type definition for the configuration
type Config = {
  env: string;
  port: number;
  clientUrl: string;
  authServiceUrl: string;
  productServiceUrl: string;
  awsCognitoUserPoolId: string;
  awsCognitoClientId: string;
  awsCloudwatchLogsRegion?: string;
  awsCloudwatchLogsGroupName?: string; // Add this property
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
};

// Function to load and validate environment variables
function loadConfig(): Config {
  // Determine the environment and set the appropriate .env file
  const env = process.env.NODE_ENV || "development";
  const envPath = path.resolve(__dirname, `./configs/.env.${env}`);
  dotenv.config({ path: envPath });

  // Define a schema for the environment variables
  const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().default("development"),
    PORT: Joi.number().default(4000),
    CLIENT_URL: Joi.string().required(),
    AUTH_SERVICE_URL: Joi.string().required(),
    PRODUCT_SERVICE_URL: Joi.string().required(),
    AWS_COGNITO_USER_POOL_ID: Joi.string().required(),
    AWS_COGNITO_CLIENT_ID: Joi.string().required(),
    AWS_CLOUDWATCH_LOGS_REGION: Joi.string().optional(),
    AWS_CLOUDWATCH_LOGS_GROUP_NAME: Joi.string().optional(), // Add this schema validation
    AWS_ACCESS_KEY_ID: Joi.string().optional(),
    AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  })
    .unknown()
    .required();

  // Validate the environment variables
  const { value: envVars, error } = envVarsSchema.validate(process.env);
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  // Return the validated and parsed configuration
  return {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    clientUrl: envVars.CLIENT_URL,
    authServiceUrl: envVars.AUTH_SERVICE_URL,
    productServiceUrl: envVars.PRODUCT_SERVICE_URL,
    awsCognitoUserPoolId: envVars.AWS_COGNITO_USER_POOL_ID,
    awsCognitoClientId: envVars.AWS_COGNITO_CLIENT_ID,
    awsCloudwatchLogsRegion: envVars.AWS_CLOUDWATCH_LOGS_REGION,
    awsCloudwatchLogsGroupName: envVars.AWS_CLOUDWATCH_LOGS_GROUP_NAME, // Include in the return
    awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
  };
}

// Export the loaded configuration
const configs = loadConfig();
export default configs;
