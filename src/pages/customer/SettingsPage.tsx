import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import PixelIcon from "../../components/ui/PixelIcon";
import SectionHeader from "../../components/ui/SectionHeader";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore, THEMES } from "../../store/themeStore";
import type { Theme } from "../../store/themeStore";
import { fetchMyStats } from "../../api/sites";
import { updateProfile, updateNotification, withdrawAccount } from "../../api/auth";
import type { SiteStatsResponse } from "../../types/api";

type SettingsTab = "account" | "saved";

const THEME_SWATCHES: Record<string, { bg: string; ink: string; dots: string[] }> = {
  default: { bg: "#fff7e6", ink: "#111111", dots: ["#EFC65D", "#EE5B61", "#67BDB0"] },
  pastel:  { bg: "#eaf1fe", ink: "#5a3a37", dots: ["#f7dfa0", "#f4a0a4", "#a8d9d4"] },
  dark:    { bg: "#1a1e2e", ink: "#f0e8e8", dots: ["#c9a030", "#c93d42", "#3d9e93"] },
  mono:    { bg: "#f5f5f5", ink: "#1a1a1a", dots: ["#d0d0d0", "#888888", "#b0b0b0"] },
};

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "account", label: "계정 설정" },
  { id: "saved", label: "담은 컴포넌트" },
];

/* ---------- notification toggle items ---------- */
interface NotifItem {
  key: string;
  name: string;
  desc: string;
  api: boolean; // true = marketingAgreed API 연동
}

const NOTIF_ITEMS: NotifItem[] = [
  { key: "marketing", name: "마케팅 수신 동의", desc: "프로모션 및 새 기능 소식", api: true },
  { key: "weekly", name: "주간 리포트", desc: "방문자 통계를 매주 메일로", api: false },
  { key: "newcomp", name: "새 컴포넌트 소식", desc: "새 컴포넌트가 올라오면", api: false },
];


export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const { theme, setTheme } = useThemeStore();

  const [tab, setTab] = useState<SettingsTab>("account");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // local-only notification toggles
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [newCompNews, setNewCompNews] = useState(false);

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

  async function handleToggleMarketing(value: boolean) {
    setTogglingNotif(true);
    try {
      const updated = await updateNotification(value);
      updateUser(updated);
    } catch {
      // keep current state on failure
    } finally {
      setTogglingNotif(false);
    }
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

  /* ---------- notification toggle state map ---------- */
  function getNotifChecked(key: string): boolean {
    if (key === "marketing") return user?.marketingAgreed ?? false;
    if (key === "weekly") return weeklyReport;
    if (key === "newcomp") return newCompNews;
    return false;
  }

  function handleNotifToggle(key: string) {
    if (key === "marketing") {
      handleToggleMarketing(!(user?.marketingAgreed ?? false));
    } else if (key === "weekly") {
      setWeeklyReport((v) => !v);
    } else if (key === "newcomp") {
      setNewCompNews((v) => !v);
    }
  }

  /* ---------- render ---------- */
  return (
    <div className="px-5 py-8 max-w-[1080px] mx-auto">
      {/* float animation keyframes */}
      <style>{`
        @keyframes jc-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(5deg); }
          50% { transform: translateY(-4px) rotate(-3deg); }
          75% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>

      <SectionHeader title="마이페이지" titleSize={28} as="h1" className="mb-6" />

      {/* ===== Profile Hero Card ===== */}
      <NeoCard bg="var(--color-secondary)" pad={28} shadow={8} border={4} className="relative mb-6">
        {/* floating heart */}
        <div
          className="absolute top-4 right-4 opacity-70"
          style={{ animation: "jc-float 5s ease-in-out infinite" }}
        >
          <PixelIcon name="heart" size={28} fill="#111" />
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {/* avatar */}
          <div
            className="neo-border-4 flex items-center justify-center font-headline text-white shrink-0"
            style={{
              width: 84,
              height: 84,
              background: "var(--color-primary)",
              boxShadow: "3px 3px 0 #111",
              fontSize: 36,
              borderRadius: 0,
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
              <p className="font-body m-0 mt-1" style={{ fontSize: 13, color: "#555" }}>
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
          { label: "만든 사이트", value: statVal(stats?.totalSites), bg: "var(--color-info)" },
          { label: "공개 사이트", value: statVal(stats?.publishedSites), bg: "var(--color-accent)" },
          { label: "받은 하트", value: statVal(stats?.totalHearts), bg: "var(--color-primary)" },
        ].map((s) => (
          <NeoCard key={s.label} bg={s.bg} pad={18} shadow={5} border={3}>
            <div className="font-headline m-0" style={{ fontSize: 30 }}>
              {s.value}
            </div>
            <div className="font-pixel" style={{ fontSize: 11 }}>
              {s.label}
            </div>
          </NeoCard>
        ))}
      </div>

      {/* ===== Tab Bar ===== */}
      <div className="flex gap-0 mb-6">
        {TABS.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`
                font-sub cursor-pointer neo-border
                px-5 py-2.5 text-sm
                ${isActive
                  ? "bg-ink text-white"
                  : "bg-bg text-ink neo-shadow-sm"
                }
              `}
              style={{ borderRadius: 0 }}
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
                <span className="font-pixel bg-ink text-secondary mr-2" style={{ fontSize: 9, padding: "2px 6px" }}>
                  TEXT
                </span>
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

          {/* Notifications + Withdraw Card */}
          <NeoCard pad={24} shadow={8} className="flex flex-col">
            <h3 className="font-headline m-0 mb-4" style={{ fontSize: 18 }}>
              알림
            </h3>

            <div className="flex flex-col gap-2.5">
              {NOTIF_ITEMS.map((item) => {
                const checked = getNotifChecked(item.key);
                const disabled = item.api && togglingNotif;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => !disabled && handleNotifToggle(item.key)}
                    className={`
                      neo-border neo-shadow-sm flex items-center gap-3 cursor-pointer w-full text-left
                      ${checked ? "bg-accent" : "bg-bg"}
                      ${disabled ? "opacity-60 pointer-events-none" : ""}
                    `}
                    style={{ borderRadius: 7, padding: "10px 11px" }}
                    disabled={disabled}
                  >
                    {/* knob */}
                    <div
                      className={checked ? "neo-border" : ""}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: checked ? "var(--color-ink)" : "#fff",
                        border: checked ? undefined : "3px solid var(--color-ink)",
                        flexShrink: 0,
                      }}
                    />
                    {/* label */}
                    <div className="flex-1 min-w-0">
                      <div className="font-sub" style={{ fontSize: 13 }}>{item.name}</div>
                      <div className="font-body" style={{ fontSize: 11, color: "#555" }}>{item.desc}</div>
                    </div>
                    {/* ON/OFF */}
                    <span className="font-pixel shrink-0" style={{ fontSize: 11 }}>
                      {checked ? "ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* spacer + divider */}
            <div className="mt-auto pt-5" style={{ borderTop: "3px solid var(--color-ink)" }}>
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
                  className={`neo-border text-left cursor-pointer ${isActive ? "neo-shadow-md" : "neo-shadow-sm"}`}
                  style={{
                    padding: 12,
                    background: swatches.bg,
                    borderWidth: isActive ? 4 : 3,
                    outline: "none",
                    borderRadius: 0,
                  }}
                >
                  {/* 미니 스와치 */}
                  <div className="flex gap-1 mb-2">
                    {swatches.dots.map((color, i) => (
                      <div
                        key={i}
                        className="neo-border"
                        style={{ width: 16, height: 16, background: color, borderWidth: 2 }}
                      />
                    ))}
                  </div>
                  <div className="font-pixel" style={{ fontSize: 10, color: swatches.ink }}>
                    {t.label}
                  </div>
                  {isActive && (
                    <div className="font-pixel mt-1" style={{ fontSize: 9, color: swatches.ink, opacity: 0.6 }}>
                      ▶ 적용중
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
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !withdrawing && setShowWithdrawModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <NeoCard pad={32} shadow={8} style={{ maxWidth: 360 }}>
              <h3 className="font-headline text-center m-0 mb-3" style={{ fontSize: 20 }}>
                정말 탈퇴하시겠어요?
              </h3>
              <p className="font-body text-center m-0 mb-6" style={{ fontSize: 13, color: "#555" }}>
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
