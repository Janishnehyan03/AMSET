const AppError = require("./AppError");

// Define the globalErrorHandler middleware
const castErrorHandler = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const duplicateErrorHandler = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `${value} aleady exist. please use another`;
  return new AppError(message, 400);
};

const globalErrorHandler = (err, req, res, next) => {
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
      prodError(err, res); // Only call prodError once
    }
  };
  
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    // error: err,
    error: err.message,
    stack: err.stack,
  });
};

const prodError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      error: "Something went very wrong!",
    });
  }
};

module.exports = globalErrorHandler;
