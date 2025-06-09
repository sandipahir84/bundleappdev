
// HTTP Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  ERROR: 422,
  UNAUTHORIZED: 401,
  WARNING: 410,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
};

export const STATUS_CODES_MESSAGES = {
  unauthorised: "Unauthorized",
  fetch: "Data fetched successfully.",
  create: "Created successfully.",
  update: "Updated successfully.",
  delete: "Deleted successfully.",
  status: "Operation successful.",
  forbidden: "You don't have permission to access this resource.",
  server_error: "Internal Server Error. Please try again later.",
  login: "Login successfully.",
  otp_success: "OTP sent successfully.",
  otp_error: "Failed to send OTP. Please try again.",
  otp_verify: "OTP verified successfully.",
  validation_error: "Validation failed.",
  warning: "Data not found.",
  verifyOtp: "OTP generated successfully. Please verify to continue.",
  verifyOtpSuccess: "OTP verified successfully. Login complete."
}