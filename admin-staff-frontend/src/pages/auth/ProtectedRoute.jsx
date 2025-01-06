import { Navigate } from "react-router-dom";
import * as jwt_decode from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");

  const getUserRole = () => {
    if (!token) return null;
    try {
      const decoded = jwt_decode.jwtDecode(token); // Using the named export
      return decoded.employeeType;
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("token"); // Clear invalid token
      return null;
    }
  };

  const userRole = getUserRole();

  if (!token || !allowedRoles.includes(userRole)) {
    // Optionally store the intended destination
    const currentPath = window.location.pathname;
    localStorage.setItem("redirectPath", currentPath);

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
