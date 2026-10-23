import { useState } from "react";
import NeoCard from "./NeoCard";
import logoSvg from "../../assets/logo.svg";
import { fetchKakaoUrl, KAKAO_STATE_KEY } from "../../api/auth";

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister?: () => void;
  variant?: "login" | "register";
  redirectPath?: string;
}

export default function LoginModal({ onClose, variant = "login", redirectPath }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleKakaoLogin() {
    setError("");
    setLoading(true);
    try {
      const { url, state } = await fetchKakaoUrl();
      // 콜백에서 대조할 수 있게 보관한다. sessionStorage라 이 탭에서만 읽히고,
      // 공격자가 만든 콜백 링크를 다른 탭/브라우저에서 열면 대조에 실패한다.
      sessionStorage.setItem(KAKAO_STATE_KEY, state);
      // 로그인 후 원래 페이지로 돌아갈 수 있도록 현재 경로 저장
      if (redirectPath) sessionStorage.setItem("auth_redirect", redirectPath);
      window.location.href = url;
    } catch {
      setError("카카오 로그인 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(48,44,58,0.38)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <NeoCard bg="var(--color-surface)" pad={0} shadow={0} border={1} radius={16} className="shadow-[0_20px_60px_rgba(57,40,66,.16)]">
        <div className="w-[360px] max-w-full">
          {/* 헤더 */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoSvg} width={16} height={14} alt="" />
              <span className="font-body text-[13px] font-semibold text-heading">
                {variant === "register" ? "JoyCraft 시작하기" : "JoyCraft 로그인"}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="font-body text-[16px] text-muted leading-none rounded-md hover:bg-subtle"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
            >
              ✕
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="font-headline text-[20px] text-heading m-0 mb-2">
                {variant === "register" ? "반가워요!" : "다시 오셨군요!"}
              </p>
              <p className="font-body text-[13px] m-0 text-muted">
                {variant === "register"
                  ? "카카오 계정 하나로 바로 시작할 수 있어요"
                  : "카카오 계정으로 간편하게 로그인하세요"}
              </p>
            </div>

            {error && (
              <div
                className="w-full font-body text-[12px] px-3 py-2 rounded-lg border border-[#e7cbd1] bg-[#fbf2f4] text-center text-danger"
              >
                {error}
              </div>
            )}

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                background: "#FEE500",
                border: "1px solid #E5CD00",
                borderRadius: 9,
                boxShadow: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {/* 카카오 말풍선 아이콘 */}
              <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path
                  d="M10 0C4.477 0 0 3.582 0 8c0 2.83 1.703 5.302 4.285 6.845L3.5 18l4.2-2.302C8.12 15.9 9.046 16 10 16c5.523 0 10-3.582 10-8S15.523 0 10 0z"
                  fill="#3C1E1E"
                />
              </svg>
              <span className="font-sub text-[15px]" style={{ color: "#3C1E1E" }}>
                {loading ? "연결 중..." : "카카오로 시작하기"}
              </span>
            </button>

            <p className="font-body text-[11px] text-center m-0 text-muted">
              로그인 시 서비스 이용약관에 동의한 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
