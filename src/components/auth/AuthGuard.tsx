import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "MASTER" | "CREATOR" | "CUSTOMER";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  // 개별 셀렉터로 구독한다. fetchMe는 스토어 생성 시 한 번만 만들어지는 안정된 참조라
  // useEffect 의존성에 넣어도 재실행되지 않는다.
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="font-pixel text-[12px] text-ink animate-pulse">LOADING...</div>
      </div>
    );
  }

  // 렌더 중 navigate()를 호출하면 React가 "다른 컴포넌트를 렌더링하는 중 상태를 갱신"한다고
  // 경고한다. 리다이렉트는 엘리먼트 반환으로 처리한다.
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
