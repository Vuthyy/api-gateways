// src/middleware/errors.ts

class AuthenticationError extends Error {
  constructor(message = "Authentication error") {
    super(message);
    this.name = "AuthenticationError";
  }
}

class AuthorizationError extends Error {
  constructor(message = "Authorization error") {
    super(message);
    this.name = "AuthorizationError";
  }
}

class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export { AuthenticationError, AuthorizationError, NotFoundError };
