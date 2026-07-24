// SectionHeader — 섹션 제목 + 우측 액션(버튼/링크) 헤더
// DashboardPage "최근 작업 / 전체 보기", MySitesPage "내 사이트 / 새 사이트" 등

interface SectionHeaderProps {
  title: string;
  titleSize?: number;       // font-size px (기본 24)
  action?: React.ReactNode; // 우측에 올 버튼 또는 링크
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export default function SectionHeader({
  title,
  titleSize = 24,
  action,
  className = "",
  as: Tag = "h2",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Tag
        className="font-headline m-0"
        style={{ fontSize: titleSize }}
      >
        {title}
      </Tag>
      {action && <div>{action}</div>}
    </div>
  );
}
