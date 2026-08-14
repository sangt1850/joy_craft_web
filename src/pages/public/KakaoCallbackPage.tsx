import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import { kakaoCallback, kakaoRegister } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

type Step = "loading" | "nickname" | "error";

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe: loadMe } = useAuthStore();

  const [step, setStep] = useState<Step>("loading");
  const [registerToken, setRegisterToken] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // StrictMode에서 useEffect가 두 번 실행되는 것을 방지
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam || !code) {
      setStep("error");
      setError("카카오 인증이 취소되었습니다.");
      return;
    }

    kakaoCallback(code)
      .then(async (res) => {
        if (res.accessToken) {
          // 기존 유저 — 바로 로그인
          localStorage.setItem("accessToken", res.accessToken);
          await loadMe();
          navigate("/dashboard", { replace: true });
        } else if (res.newUser && res.registerToken) {
          // 신규 유저 — 닉네임 입력 단계
          setRegisterToken(res.registerToken);
          setStep("nickname");
        }
      })
      .catch(() => {
        setStep("error");
        setError("카카오 로그인 처리 중 오류가 발생했습니다.");
      });
  }, []);

  async function handleRegister() {
    setLoading(true);
    try {
      const res = await kakaoRegister(registerToken, nickname);
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        await loadMe();
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="font-pixel text-[12px] text-ink animate-pulse">카카오 로그인 중...</div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <NeoCard bg="var(--color-cream)" pad={32} shadow={6}>
          <div className="text-center flex flex-col gap-4" style={{ width: 300 }}>
            <p className="font-headline text-[20px] text-ink m-0">로그인 실패</p>
            <p className="font-body text-[13px] m-0" style={{ color: "#666" }}>{error}</p>
            <NeoButton bg="var(--color-pink)" size="md" block onClick={() => navigate("/")}>
              돌아가기
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    );
  }

  // step === "nickname"
  return (
    <div className="flex items-center justify-center h-screen bg-cream">
      <NeoCard bg="var(--color-cream)" pad={0} shadow={8} border={4}>
        <div style={{ width: 360 }}>
          {/* 헤더 */}
          <div className="bg-ink px-6 py-4 flex items-center gap-2">
            <span className="font-pixel text-[11px] text-cream">JoyCraft에 오신 걸 환영해요!</span>
          </div>

          {/* 본문 */}
          <div className="px-6 py-8 flex flex-col gap-5">
            <div>
              <p className="font-headline text-[18px] text-ink m-0 mb-1">닉네임을 정해주세요 ✨</p>
              <p className="font-body text-[12px] m-0" style={{ color: "#888" }}>
                비워두면 랜덤 닉네임이 자동으로 만들어져요
              </p>
            </div>

            <input
              className="neo-input w-full"
              type="text"
              placeholder="예: 행복한토끼123 (선택)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
              autoFocus
            />

            {error && (
              <div
                className="font-body text-[12px] px-3 py-2 neo-border"
                style={{ background: "var(--color-peach)", color: "#111" }}
              >
                {error}
              </div>
            )}

            <NeoButton
              bg="var(--color-pink)"
              size="md"
              block
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "가입 중..." : "JoyCraft 시작하기 🎉"}
            </NeoButton>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
