import { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetCurrentUser, useLoginUser, useLogoutUser, getGetCurrentUserQueryKey, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLoginUser>["mutate"];
  logout: ReturnType<typeof useLogoutUser>["mutate"];
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  const [, setLocation] = useLocation();

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        refetch();
        setLocation("/dashboard");
      }
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("pos_tab_auth");
        }
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        queryClient.removeQueries({ queryKey: getGetCurrentUserQueryKey() });
        refetch();
        setLocation("/login");
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      }
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;
    const hasTabSession = window.sessionStorage.getItem("pos_tab_auth") === "1";
    if (user && !hasTabSession) {
      logoutMutation.mutate();
      return;
    }
    if (user && hasTabSession) {
      const syncLogoutOnClose = () => {
        navigator.sendBeacon?.("/api/users/logout");
      };
      window.addEventListener("unload", syncLogoutOnClose);
      return () => window.removeEventListener("unload", syncLogoutOnClose);
    }

    return undefined;
  }, [user, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login: ((payload: any) => {
          loginMutation.mutate(payload, {
            onSuccess: () => {
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem("pos_tab_auth", "1");
              }
              queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
              refetch();
              setLocation("/dashboard");
            },
          });
        }) as ReturnType<typeof useLoginUser>["mutate"],
        logout: logoutMutation.mutate,
        isLoggingIn: loginMutation.isPending
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
