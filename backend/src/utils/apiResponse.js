// importing expres response object, data payload, success message

export const sendSuccess = (
  res,
  data,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (
  res,
  message = "Failed, something went wrong",
  statusCode = 500,
  errors = null,
) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};
