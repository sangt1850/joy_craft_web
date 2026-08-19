import React, { useState, useEffect, useRef } from 'react';

interface NbDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}

interface NbDropdownProps {
  trigger: React.ReactNode;
  items: NbDropdownItem[];
}

const NbDropdown: React.FC<NbDropdownProps> = ({ trigger, items }) => {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    position: 'relative',
    display: 'inline-flex',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    width: '180px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0 #1A1A1A',
    borderRadius: '8px',
    zIndex: 10,
    overflow: 'hidden',
  };

  return (
    <div ref={ref} style={wrapperStyle}>
      <span onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        {trigger}
      </span>
      {open && (
        <div style={menuStyle}>
          {items.map((item, i) => {
            const isHovered = hoveredIndex === i;

            const itemStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              fontSize: '13.6px',
              cursor: 'pointer',
              color: item.destructive ? '#FF4757' : '#1A1A1A',
              background: isHovered
                ? item.destructive
                  ? 'rgba(255,71,87,0.1)'
                  : 'rgba(26,26,26,0.06)'
                : '#FFFFFF',
              borderTop: i > 0 ? '2px solid #1A1A1A' : 'none',
              transition: 'background .1s',
            };

            return (
              <div
                key={i}
                style={itemStyle}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NbDropdown;
