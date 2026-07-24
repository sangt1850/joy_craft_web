// 설정 페이지 — "곧 제공 예정" 안내
import NeoCard from "../../components/ui/NeoCard";

export default function SettingsPage() {
  return (
    <div className="px-7 py-8 max-w-[600px] mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <NeoCard pad={48} style={{ textAlign: "center", width: "100%" }}>
        <div className="text-[56px] mb-6">⚙️</div>
        <h1 className="font-headline text-[26px] m-0 mb-4">설정</h1>
        <p className="font-body text-[14px] text-[#555] leading-[1.8] mb-8">
          계정 정보 수정, 알림 설정, 구독 관리 등<br />
          다양한 설정 기능이 곧 제공됩니다.
        </p>

        {/* 로딩바 — @keyframes progress는 index.css에 정의 */}
        <div className="h-3 bg-black/10 neo-border overflow-hidden mb-5" style={{ borderRadius: 0 }}>
          <div
            className="h-full bg-mustard"
            style={{ animation: "progress 2.4s ease-in-out infinite" }}
          />
        </div>

        <div className="font-pixel text-[9px] text-[#888] tracking-wider">
          COMING SOON...
        </div>
      </NeoCard>
    </div>
  );
}
