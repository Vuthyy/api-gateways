// src/utils/logger.ts

import config from "../configs";
import { Response } from "express";
import winston from "winston";
import WinstonCloudwatch from "winston-cloudwatch";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "../middleware/errors";

const createLogger = ({
  awsRegion = config.awsCloudwatchLogsRegion,
  logGroupName,
  service,
  level,
}: {
  awsRegion?: string;
  logGroupName: string;
  service: string;
  level: string;
}) => {
  const options = {
    console: {
      level,
      handleExceptions: true,
      json: false,
      colorize: true,
    },
    cloudwatch: {
      level,
      logGroupName,
      logStreamName: `${service}-${new Date().toISOString().split("T")[0]}`,
      awsRegion,
      awsAccessKeyId: config.awsAccessKeyId,
      awsSecretKey: config.awsSecretAccessKey,
    },
  };

  const cloudWatchTransport = new WinstonCloudwatch(options.cloudwatch);

  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(options.console),
      cloudWatchTransport,
    ],
  });

  return logger;
};

const formatObject = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
};

export const logRequest = (
  logger: winston.Logger,
  logInfo: {
    method?: string;
    url?: string;
    headers?: any;
    protocol?: string;
    host?: string;
    path?: string;
  }
) => {
  logger.info(`Incoming Request: ${formatObject(logInfo)}`);
};

export const logResponse = (
  logger: winston.Logger,
  res: Response,
  additionalInfo: object = {}
) => {
  logger.info("Outgoing Response", {
    statusCode: res.statusCode,
    headers: res.getHeaders(),
    ...additionalInfo,
  });
};

export const logError = (
  logger: winston.Logger,
  error: Error,
  additionalInfo: object = {}
) => {
  logger.error("Error", {
    message: error.message,
    stack: error.stack,
    ...additionalInfo,
    errorType:
      error instanceof AuthenticationError
        ? "AuthenticationError"
        : error instanceof AuthorizationError
        ? "AuthorizationError"
        : error instanceof NotFoundError
        ? "NotFoundError"
        : "GeneralError",
  });
};

export default createLogger;
