
export function notFound(req, res) {
  return res.status(404).json({
    message: "Route not found.",
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  // Mongoose validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Request validation failed.",
    });
  }

  // Invalid MongoDB document IDs or malformed values
  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid value provided.",
    });
  }

  // Duplicate values for unique database indexes
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with this value already exists.",
    });
  }

  // Malformed JSON request bodies
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON request body.",
    });
  }

  // Unexpected errors: never expose internal details to clients.
  return res.status(500).json({
    message: "Internal server error.",
  });
}
