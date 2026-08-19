import React, { useState } from 'react';

interface NbAccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface NbAccordionProps {
  items: NbAccordionItem[];
  allowMultiple?: boolean;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s', flexShrink: 0 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const NbAccordion: React.FC<NbAccordionProps> = ({ items, allowMultiple = false }) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        const hovered = hoveredId === item.id;

        const itemStyle: React.CSSProperties = {
          border: '2px solid #1A1A1A',
          borderRadius: '8px',
          boxShadow: '4px 4px 0 #1A1A1A',
          marginBottom: '12px',
          overflow: 'hidden',
        };

        const headerStyle: React.CSSProperties = {
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          background: hovered ? '#FFE66D' : '#FFFFFF',
          transition: 'background .15s',
          userSelect: 'none',
        };

        const contentStyle: React.CSSProperties = {
          padding: open ? '0 18px 16px' : '0 18px',
          color: '#6B6B6B',
          fontSize: '13.6px',
          lineHeight: 1.6,
          maxHeight: open ? '500px' : '0',
          overflow: 'hidden',
          transition: 'max-height .2s ease, padding .2s ease',
        };

        return (
          <div key={item.id} style={itemStyle}>
            <div
              style={headerStyle}
              onClick={() => toggle(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span>{item.question}</span>
              <ChevronIcon open={open} />
            </div>
            <div style={contentStyle}>{item.answer}</div>
          </div>
        );
      })}
    </div>
  );
};

export default NbAccordion;
