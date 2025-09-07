import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import Login from "@/pages/login";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: authStatus, isLoading, error } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: () => authService.getStatus(),
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle loading state with timeout
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.log("Auth check failed, showing login");
    return <Login />;
  }

  // Handle unauthenticated state
  if (!authStatus?.authenticated) {
    return <Login />;
  }

  return <>{children}</>;
}
