import { useState } from "react";
import NeoButton from "./NeoButton";
import NeoCard from "./NeoCard";
import PixelIcon from "./PixelIcon";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
}

type Step = "login" | "force";

export default function LoginModal({ onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const [step, setStep] = useState<Step>("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [preAuthTicket, setPreAuthTicket] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data?.code;
        if (code === "MEMBER_NOT_FOUND" || code === "INVALID_CREDENTIALS") {
          setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError("로그인에 실패했습니다. 다시 시도해주세요.");
        }
        return;
      }
      if (data.alreadyLogin && data.preAuthTicket) {
        setPreAuthTicket(data.preAuthTicket);
        setStep("force");
        return;
      }
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        onSuccess();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogin() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/force-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ preAuthTicket }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("강제 로그인에 실패했습니다. 처음부터 다시 시도해주세요.");
        setStep("login");
        return;
      }
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        onSuccess();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
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
              <PixelIcon name="heart" size={14} fill="var(--color-pink)" />
              <span className="font-pixel text-[11px] text-cream">
                {step === "force" ? "다른 기기에서 로그인 중" : "JoyCraft 로그인"}
              </span>
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
          <div className="px-6 py-7">
            {step === "login" ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="font-sub text-[12px] text-ink block mb-1.5">아이디</label>
                  <input
                    className="neo-input w-full"
                    type="text"
                    placeholder="아이디 입력"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-sub text-[12px] text-ink block mb-1.5">비밀번호</label>
                  <input
                    className="neo-input w-full"
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    className="font-body text-[12px] px-3 py-2 neo-border"
                    style={{ background: "var(--color-peach)", color: "#111" }}
                  >
                    {error}
                  </div>
                )}

                <NeoButton
                  type="submit"
                  bg="var(--color-pink)"
                  size="md"
                  block
                  disabled={loading}
                >
                  {loading ? "로그인 중..." : "시작하기"}
                </NeoButton>

                {onSwitchToRegister && (
                  <p className="font-body text-[12px] text-center m-0" style={{ color: "#666" }}>
                    계정이 없으신가요?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="font-sub text-ink underline"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      회원가입
                    </button>
                  </p>
                )}
              </form>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="neo-border p-4" style={{ background: "var(--color-mustard)" }}>
                  <p className="font-sub text-[13px] text-ink m-0 leading-[1.6]">
                    다른 기기에서 이미 로그인되어 있습니다.<br />
                    기존 세션을 종료하고 여기서 로그인할까요?
                  </p>
                </div>

                {error && (
                  <div
                    className="font-body text-[12px] px-3 py-2 neo-border"
                    style={{ background: "var(--color-peach)", color: "#111" }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <NeoButton
                    bg="var(--color-cream)"
                    color="#111"
                    size="sm"
                    onClick={() => { setStep("login"); setError(""); }}
                    disabled={loading}
                  >
                    취소
                  </NeoButton>
                  <NeoButton
                    bg="var(--color-ink)"
                    color="#fff"
                    size="sm"
                    block
                    onClick={handleForceLogin}
                    disabled={loading}
                  >
                    {loading ? "처리 중..." : "기존 세션 종료 후 로그인"}
                  </NeoButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
