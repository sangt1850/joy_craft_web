import React, { useState } from 'react';

interface NbPaginationProps {
  total: number;
  current: number;
  onChange: (page: number) => void;
}

const NbPagination: React.FC<NbPaginationProps> = ({ total, current, onChange }) => {
  const [hovered, setHovered] = useState<number | string | null>(null);

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  const baseBtn = (key: number | string, label: React.ReactNode, active: boolean, disabled: boolean, onClick: () => void): React.ReactNode => {
    const isHovered = hovered === key;

    const btnStyle: React.CSSProperties = {
      fontFamily: "'Space Grotesk', sans-serif",
      height: '36px',
      minWidth: '36px',
      padding: '0 10px',
      border: '2px solid #1A1A1A',
      boxShadow: isHovered && !disabled ? '4px 4px 0 #1A1A1A' : '2px 2px 0 #1A1A1A',
      borderRadius: '8px',
      background: active ? '#FF6B6B' : '#FFFFFF',
      color: '#1A1A1A',
      fontSize: '13.6px',
      fontWeight: active ? 700 : 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transform: isHovered && !disabled ? 'translate(-1px,-1px)' : 'translate(0,0)',
      transition: 'transform .1s, box-shadow .1s',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <button
        key={key}
        style={btnStyle}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => !disabled && setHovered(key)}
        onMouseLeave={() => setHovered(null)}
      >
        {label}
      </button>
    );
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  return (
    <div style={wrapperStyle}>
      {baseBtn('prev', '← Prev', false, current === 1, () => onChange(current - 1))}
      {pages.map((p) =>
        baseBtn(p, p, p === current, false, () => onChange(p))
      )}
      {baseBtn('next', 'Next →', false, current === total, () => onChange(current + 1))}
    </div>
  );
};

export default NbPagination;
