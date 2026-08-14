import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "MASTER" | "CREATOR" | "CUSTOMER";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isLoading, isAuthenticated, user, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="font-pixel text-[12px] text-ink animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    navigate("/", { replace: true });
    return null;
  }

  return <>{children}</>;
}
