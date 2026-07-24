// 공개 플레이어 페이지 — 완성된 사이트를 링크로 보는 화면
import { useParams } from "react-router-dom";

export default function PlayerPage() {
  const { siteId } = useParams<{ siteId: string }>();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #FFB784 0%, #FF57A6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: 10,
          color: "#fff",
          marginBottom: 32,
          opacity: 0.7,
        }}
      >
        SITE: {siteId}
      </div>
      <div
        style={{
          fontFamily: "var(--font-headline)",
          fontSize: 32,
          color: "#fff",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        사이트 준비 중 🎁
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
        }}
      >
        슬라이드 플레이어가 곧 완성됩니다.
      </p>
    </div>
  );
}
