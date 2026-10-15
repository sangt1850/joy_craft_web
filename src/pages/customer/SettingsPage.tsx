import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore, THEMES } from "../../store/themeStore";
import type { Theme } from "../../store/themeStore";
import { fetchMyStats } from "../../api/sites";
import { updateProfile, withdrawAccount } from "../../api/auth";
import type { SiteStatsResponse } from "../../types/api";

type SettingsTab = "account" | "saved";

const THEME_SWATCHES: Record<string, { bg: string; ink: string; dots: string[] }> = {
  default: { bg: "#f8f7fa", ink: "#302c3a", dots: ["#41314f", "#796086", "#edeaf1"] },
  pastel:  { bg: "#faf7fc", ink: "#3b3142", dots: ["#765d82", "#9b7ca7", "#eee5f2"] },
  dark:    { bg: "#211d25", ink: "#f3eef5", dots: ["#a993b4", "#44394b", "#342e39"] },
  mono:    { bg: "#f7f7f7", ink: "#292929", dots: ["#353535", "#666666", "#e6e6e6"] },
};

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "account", label: "계정 설정" },
  { id: "saved",   label: "담은 컴포넌트" },
];


export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const { theme, setTheme } = useThemeStore();

  const [tab, setTab] = useState<SettingsTab>("account");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // stats
  const [stats, setStats] = useState<SiteStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ref for scrolling to account section
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  /* ---------- handlers ---------- */
  async function handleSaveProfile() {
    if (!displayName.trim() || displayName.trim().length < 2) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProfile(displayName.trim());
      updateUser(updated);
      setMessage("변경되었습니다");
    } catch {
      setMessage("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await withdrawAccount();
      await logout();
      navigate("/");
    } catch {
      setWithdrawing(false);
      setShowWithdrawModal(false);
    }
  }

  function handleEditProfileClick() {
    setTab("account");
    setTimeout(() => {
      accountRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  /* ---------- helpers ---------- */
  const initial = (user?.displayName ?? "?").charAt(0).toUpperCase();
  const createdDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const statVal = (v: number | undefined | null) => (statsLoading ? "\u2014" : (v ?? "\u2014").toString());

  /* ---------- render ---------- */
  return (
    <div className="px-4 py-7 md:px-8 md:py-9 max-w-[1120px] mx-auto">

      <SectionHeader title="마이페이지" titleSize={28} as="h1" className="mb-6" />

      {/* ===== Profile Hero Card ===== */}
      <NeoCard bg="var(--color-surface)" pad={28} shadow={0} border={1} className="relative mb-6">

        <div className="flex flex-wrap items-center gap-5">
          {/* avatar */}
          <div
            className="flex items-center justify-center font-headline text-white shrink-0"
            style={{
              width: 84,
              height: 84,
              background: "var(--color-primary)",
              fontSize: 36,
              borderRadius: 18,
            }}
          >
            {initial}
          </div>

          {/* name + date */}
          <div className="flex-1 min-w-0">
            <h1 className="font-headline m-0" style={{ fontSize: 26 }}>
              {user?.displayName ?? "사용자"}
            </h1>
            {createdDate && (
              <p className="font-body m-0 mt-1 text-muted" style={{ fontSize: 13 }}>
                {createdDate} 가입
              </p>
            )}
          </div>

          {/* action buttons */}
          <NeoButton
            bg="var(--color-bg)"
            color="var(--color-ink)"
            size="sm"
            onClick={handleEditProfileClick}
          >
            프로필 편집
          </NeoButton>
        </div>
      </NeoCard>

      {/* ===== Stats Grid ===== */}
      <div
        className="mb-6"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: "만든 사이트", value: statVal(stats?.totalSites) },
          { label: "공개 사이트", value: statVal(stats?.publishedSites) },
        ].map((s) => (
          <NeoCard key={s.label} pad={18} shadow={0} border={1}>
            <div className="font-headline m-0" style={{ fontSize: 30 }}>
              {s.value}
            </div>
            <div className="font-body text-muted" style={{ fontSize: 11 }}>
              {s.label}
            </div>
          </NeoCard>
        ))}
      </div>

      {/* ===== Tab Bar ===== */}
      <div className="inline-flex gap-[3px] mb-6 rounded-[11px] bg-selected p-1">
        {TABS.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`
                font-sub cursor-pointer border-0 rounded-lg
                px-5 py-2.5 text-sm
                ${isActive
                  ? "bg-white text-heading shadow-sm font-semibold"
                  : "bg-transparent text-muted"
                }
              `}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== Tab Content ===== */}

      {/* --- Account Settings Tab --- */}
      {tab === "account" && (
        <div
          ref={accountRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 22,
          }}
        >
          {/* Basic Info Card */}
          <NeoCard pad={24} shadow={8}>
            <h3 className="font-headline m-0 mb-4" style={{ fontSize: 18 }}>
              기본 정보
            </h3>

            <div className="mb-3">
              <div className="mb-1.5 flex items-center">
                <span className="font-sub" style={{ fontSize: 13 }}>닉네임</span>
              </div>
              <input
                className="neo-input w-full"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setMessage(null);
                }}
                maxLength={20}
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {message && (
              <p className="font-body m-0 mb-3" style={{ fontSize: 13 }}>
                {message}
              </p>
            )}

            <NeoButton
              bg="var(--color-secondary)"
              color="var(--color-ink)"
              size="md"
              block
              onClick={handleSaveProfile}
              disabled={saving || !displayName.trim() || displayName.trim().length < 2}
            >
              {saving ? "저장 중..." : "변경 사항 저장"}
            </NeoButton>
          </NeoCard>

          {/* Account Actions Card */}
          <NeoCard pad={24} shadow={8} className="flex flex-col">
            <h3 className="font-headline m-0 mb-4" style={{ fontSize: 18 }}>
              계정 관리
            </h3>
            <p className="font-body text-muted m-0 mb-5" style={{ fontSize: 13 }}>
              로그아웃하거나 계정을 영구 삭제할 수 있습니다.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <NeoButton
                bg="var(--color-bg)"
                color="var(--color-ink)"
                size="md"
                block
                onClick={handleLogout}
              >
                로그아웃
              </NeoButton>
              <NeoButton
                bg="var(--color-primary)"
                color="#fff"
                size="md"
                block
                onClick={() => setShowWithdrawModal(true)}
              >
                회원 탈퇴
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}

      {/* --- Theme Card (account tab 하단) --- */}
      {tab === "account" && (
        <NeoCard pad={24} shadow={8} className="mt-5">
          <h3 className="font-headline m-0 mb-4" style={{ fontSize: 18 }}>
            테마
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {THEMES.map((t) => {
              const swatches = THEME_SWATCHES[t.id];
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as Theme)}
                  className="text-left cursor-pointer rounded-[12px] border border-border"
                  style={{
                    padding: 12,
                    background: swatches.bg,
                    borderColor: isActive ? "var(--color-secondary)" : "var(--color-border)",
                    outline: "none",
                    borderRadius: 12,
                  }}
                >
                  {/* 미니 스와치 */}
                  <div className="flex gap-1 mb-2">
                    {swatches.dots.map((color, i) => (
                      <div
                        key={i}
                        className="rounded-full border border-black/10"
                        style={{ width: 16, height: 16, background: color }}
                      />
                    ))}
                  </div>
                  <div className="font-body font-semibold" style={{ fontSize: 11, color: swatches.ink }}>
                    {t.label}
                  </div>
                  {isActive && (
                    <div className="font-body mt-1" style={{ fontSize: 9, color: swatches.ink, opacity: 0.6 }}>
                      적용 중
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </NeoCard>
      )}

      {/* --- Saved Components Tab --- */}
      {tab === "saved" && (
        <NeoCard pad={32} shadow={8} className="text-center">
          <div style={{ fontSize: 48 }} className="mb-3">&#128230;</div>
          <h3 className="font-headline m-0 mb-2" style={{ fontSize: 20 }}>담은 컴포넌트</h3>
          <p className="font-body m-0" style={{ fontSize: 14 }}>준비 중입니다.</p>
        </NeoCard>
      )}

      {/* ===== Withdraw Confirmation Modal ===== */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(48,44,58,.38)", backdropFilter: "blur(4px)" }}
          onClick={() => !withdrawing && setShowWithdrawModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <NeoCard pad={32} shadow={8} style={{ maxWidth: 360 }}>
              <h3 className="font-headline text-center m-0 mb-3" style={{ fontSize: 20 }}>
                정말 탈퇴하시겠어요?
              </h3>
              <p className="font-body text-center m-0 mb-6 text-muted" style={{ fontSize: 13 }}>
                탈퇴 시 모든 사이트와 데이터가 삭제됩니다.
              </p>
              <div className="flex gap-2.5 justify-center">
                <NeoButton
                  bg="var(--color-bg)"
                  color="var(--color-ink)"
                  size="sm"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawing}
                >
                  취소
                </NeoButton>
                <NeoButton
                  bg="var(--color-primary)"
                  color="#fff"
                  size="sm"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? "처리 중..." : "탈퇴"}
                </NeoButton>
              </div>
            </NeoCard>
          </div>
        </div>
      )}
    </div>
  );
}
