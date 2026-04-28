import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "user" | "admin";

interface AuthContextType {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  role: UserRole | null;
  token: string | null;
  login: (phone: string, userRole: UserRole, authToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedPhone = localStorage.getItem("phoneNumber");
    const storedRole = localStorage.getItem("userRole") as UserRole | null;
    const storedToken = localStorage.getItem("authToken");

    if (storedAuth === "true" && storedPhone && storedRole && storedToken) {
      setIsAuthenticated(true);
      setPhoneNumber(storedPhone);
      setRole(storedRole);
      setToken(storedToken);
    }
  }, []);

  const login = (phone: string, userRole: UserRole, authToken: string) => {
    setIsAuthenticated(true);
    setPhoneNumber(phone);
    setRole(userRole);
    setToken(authToken);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("phoneNumber", phone);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("authToken", authToken);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPhoneNumber(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, phoneNumber, role, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
