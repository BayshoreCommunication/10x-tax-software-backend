const errorResponse = (
  res,
  { statusCode = 500, message = "Internal Server Error", details = null } = {}
) => {
  const response = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

const successResponse = (
  res,
  { statusCode = 200, message = "Success", payload = {} } = {}
) => {
  res.status(statusCode).json({
    success: true,
    message,
    payload,
  });
};

module.exports = { successResponse, errorResponse };
