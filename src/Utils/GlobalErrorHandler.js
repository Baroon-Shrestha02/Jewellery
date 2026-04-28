const GlobalErrorHandler = (err, req, res, next) => {
  // show complete error message for debugging
  console.error("ERROR", err);
  // If error has no statusCode, default to 500
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? "fail" : "error",
    message,
  });
};

export default GlobalErrorHandler;
