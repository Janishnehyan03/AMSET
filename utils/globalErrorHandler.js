const AppError = require("./AppError");

// Error handler for casting errors
const castErrorHandler = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Error handler for duplicate field errors
const duplicateErrorHandler = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `${value} already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Development error response
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// Production error response
const prodError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Log error for internal tracking
    console.error('ERROR 💥', err);

    // Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  // Check if headers are already sent
  if (res.headersSent) {
    return next(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    if (err.name === "CastError") {
      err = castErrorHandler(err);
    } else if (err.code === 11000) {
      err = duplicateErrorHandler(err);
    }
    devError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") {
      err = castErrorHandler(err);
    } else if (err.code === 11000) {
      err = duplicateErrorHandler(err);
    }
    prodError(err, res);
  }
};

module.exports = globalErrorHandler;
