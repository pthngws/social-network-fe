import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  return children; // No redirect, always render the child component
};

export default PublicRoute;