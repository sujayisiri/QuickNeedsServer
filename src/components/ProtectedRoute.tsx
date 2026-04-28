import { Redirect, Route, RouteProps } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps extends RouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  ...rest
}) => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location },
              }}
            />
          );
        }

        if (requiredRole && role !== requiredRole) {
          // Redirect to appropriate dashboard based on role
          const redirectPath = role === "admin" ? "/admin" : "/tabs";
          return <Redirect to={redirectPath} />;
        }

        return children;
      }}
    />
  );
};

export default ProtectedRoute;
