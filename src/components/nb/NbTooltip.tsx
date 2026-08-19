import React, { useState } from 'react';

interface NbTooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

const NbTooltip: React.FC<NbTooltipProps> = ({ content, position = 'top', children }) => {
  const [visible, setVisible] = useState(false);

  const tooltipPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { top: '50%', left: 'calc(100% + 8px)', transform: 'translateY(-50%)' };
      case 'left':
        return { top: '50%', right: 'calc(100% + 8px)', transform: 'translateY(-50%)' };
    }
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const tooltipStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    position: 'absolute',
    background: '#1A1A1A',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12.8px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity .15s',
    zIndex: 100,
    ...tooltipPositionStyle(),
  };

  return (
    <span
      style={wrapperStyle}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span style={tooltipStyle}>{content}</span>
    </span>
  );
};

export default NbTooltip;
