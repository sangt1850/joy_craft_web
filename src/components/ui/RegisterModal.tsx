import { useState } from "react";
import NeoButton from "./NeoButton";
import NeoCard from "./NeoCard";
import PixelIcon from "./PixelIcon";

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterModal({ onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (loginId.length < 4 || loginId.length > 20) return "아이디는 4~20자여야 합니다.";
    if (!/^[a-zA-Z0-9_]+$/.test(loginId)) return "아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    if (!name.trim()) return "이름을 입력해주세요.";
    return null;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId,
          password,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          marketingAgreed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const code = data?.code;
        if (code === "DUPLICATE_LOGIN_ID") {
          setError("이미 사용 중인 아이디입니다.");
        } else if (code === "DUPLICATE_EMAIL") {
          setError("이미 등록된 이메일입니다.");
        } else {
          setError("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
        return;
      }

      // 가입 성공 → 자동 로그인
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginId, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.accessToken) {
        localStorage.setItem("accessToken", loginData.accessToken);
        onSuccess();
      } else {
        // 자동 로그인 실패 시 로그인 모달로 전환
        onSwitchToLogin?.();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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
        <div className="w-[380px] max-w-full" style={{ maxHeight: "90vh", overflowY: "auto" }}>
          {/* 헤더 */}
          <div className="bg-ink px-6 py-4 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-2">
              <PixelIcon name="star" size={14} fill="var(--color-mustard)" />
              <span className="font-pixel text-[11px] text-cream">JoyCraft 회원가입</span>
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
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* 아이디 */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  아이디 <span style={{ color: "var(--color-pink)" }}>*</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="text"
                  placeholder="영문·숫자·밑줄 4~20자"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  비밀번호 <span style={{ color: "var(--color-pink)" }}>*</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="password"
                  placeholder="8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  비밀번호 확인 <span style={{ color: "var(--color-pink)" }}>*</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>

              {/* 이름 */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  이름 <span style={{ color: "var(--color-pink)" }}>*</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="text"
                  placeholder="이름 입력"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* 이메일 (선택) */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  이메일 <span className="font-body" style={{ color: "#888", fontSize: 11 }}>(선택)</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* 휴대폰 (선택) */}
              <div>
                <label className="font-sub text-[12px] text-ink block mb-1.5">
                  휴대폰 <span className="font-body" style={{ color: "#888", fontSize: 11 }}>(선택)</span>
                </label>
                <input
                  className="neo-input w-full"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* 마케팅 동의 */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="neo-border"
                  style={{ width: 16, height: 16, accentColor: "var(--color-pink)", cursor: "pointer" }}
                />
                <span className="font-body text-[12px]" style={{ color: "#555" }}>
                  이벤트·혜택 마케팅 정보 수신 동의 (선택)
                </span>
              </label>

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
                bg="var(--color-mustard)"
                color="#111"
                size="md"
                block
                disabled={loading}
              >
                {loading ? "가입 중..." : "가입하기"}
              </NeoButton>

              {onSwitchToLogin && (
                <p className="font-body text-[12px] text-center m-0" style={{ color: "#666" }}>
                  이미 계정이 있으신가요?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-sub text-ink underline"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    로그인
                  </button>
                </p>
              )}
            </form>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
