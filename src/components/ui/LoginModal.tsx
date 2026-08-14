import { useState } from "react";
import NeoButton from "./NeoButton";
import NeoCard from "./NeoCard";
import logoSvg from "../../assets/logo.svg";
import { fetchKakaoUrl } from "../../api/auth";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleKakaoLogin() {
    setError("");
    setLoading(true);
    try {
      const url = await fetchKakaoUrl();
      window.location.href = url;
    } catch {
      setError("카카오 로그인 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(17,17,17,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <NeoCard bg="var(--color-cream)" pad={0} shadow={8} border={4}>
        <div className="w-[360px] max-w-full">
          {/* 헤더 */}
          <div className="bg-ink px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoSvg} width={16} height={14} alt="" />
              <span className="font-pixel text-[11px] text-cream">JoyCraft 시작하기</span>
            </div>
            <button
              onClick={onClose}
              className="font-pixel text-[13px] text-cream leading-none"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
            >
              ✕
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="font-headline text-[20px] text-ink m-0 mb-2">환영합니다! 👋</p>
              <p className="font-body text-[13px] m-0" style={{ color: "#666" }}>
                카카오 계정으로 간편하게 시작하세요
              </p>
            </div>

            {error && (
              <div
                className="w-full font-body text-[12px] px-3 py-2 neo-border text-center"
                style={{ background: "var(--color-peach)", color: "#111" }}
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
                border: "3px solid #111",
                boxShadow: "4px 4px 0 #111",
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

            <p className="font-body text-[11px] text-center m-0" style={{ color: "#999" }}>
              로그인 시 서비스 이용약관에 동의한 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
