import jwt from "jsonwebtoken";

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

// Centralized token verification
const verifyToken = (token, requireRole = null) => {
  if (!token) {
    throw new AuthError("No authentication token found");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (requireRole) {
      const { type, employeeType } = decoded;
      if (type !== "employee" || employeeType !== requireRole) {
        throw new AuthError(`${requireRole} access required`, 403);
      }
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (error.name === "JsonWebTokenError") {
      throw new AuthError("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw new AuthError("Token has expired");
    }
    throw new AuthError("Authentication failed");
  }
};

// Error handling middleware
const handleAuthError = (error, res) => {
  const statusCode = error.statusCode || 401;
  const message = error.message || "Authentication failed";
  res.status(statusCode).json({
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  });
};

// Base authentication middleware
export const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    console.log("Decoded token in auth middleware:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Admin authentication middleware
export const adminAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token, "admin");
    req.user = decoded;
    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Staff authentication middleware
export const staffAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token, "staff");
    req.user = decoded;
    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};
