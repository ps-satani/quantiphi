// Error carrying an HTTP status so the error middleware can respond correctly.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wraps async route handlers so rejected promises reach the error middleware (Express 4).
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
