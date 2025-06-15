// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { 
  useCurrentUser, 
  useLogin, 
  useRegister, 
  useUpdatePreferences, 
  useLogout 
} from '@/hooks/queries/useAuth';
import type { User, LoginRequest, RegisterRequest } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (
    preferences: Partial<User["preferences"]>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // TanStack Query hooks
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const updatePreferencesMutation = useUpdatePreferences();
  const logout = useLogout();

  const login = async (credentials: LoginRequest) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterRequest) => {
    await registerMutation.mutateAsync(userData);
  };

  const updateUserPreferences = async (
    preferences: Partial<User["preferences"]>
  ) => {
    await updatePreferencesMutation.mutateAsync(preferences);
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: error || loginMutation.error || registerMutation.error,
    login,
    register,
    logout,
    updateUserPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};