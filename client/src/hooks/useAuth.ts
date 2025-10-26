import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isAdmin = user && (user.role === 'admin' || user.role === 'superuser');

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    role: user?.role || 'user',
  };
}