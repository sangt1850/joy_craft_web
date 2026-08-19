import React, { useState } from 'react';

interface NbTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface NbTabsProps {
  tabs: NbTab[];
  defaultTab?: string;
}

const NbTabs: React.FC<NbTabsProps> = ({ tabs, defaultTab }) => {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    border: '2px solid #1A1A1A',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
    boxShadow: '4px 4px 0 #1A1A1A',
  };

  const contentStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    border: '2px solid #1A1A1A',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    padding: '16px 18px',
    background: '#FFFFFF',
    fontSize: '14px',
    color: '#1A1A1A',
  };

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={headerStyle}>
        {tabs.map((tab, i) => {
          const isActive = tab.id === active;
          const isHovered = hoveredTab === tab.id;

          const tabStyle: React.CSSProperties = {
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: isActive ? 500 : 400,
            background: isActive ? '#FFE66D' : isHovered ? 'rgba(26,26,26,0.05)' : '#FFFFFF',
            color: '#1A1A1A',
            border: 'none',
            borderRight: i < tabs.length - 1 ? '2px solid #1A1A1A' : 'none',
            cursor: 'pointer',
            transition: 'background .15s',
            textAlign: 'center',
          };

          return (
            <button
              key={tab.id}
              style={tabStyle}
              onClick={() => setActive(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div style={contentStyle}>{activeTab?.content}</div>
    </div>
  );
};

export default NbTabs;
