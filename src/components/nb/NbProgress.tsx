import React from 'react';

interface NbProgressProps {
  label: string;
  value: number;
  color?: string;
}

const NbProgress: React.FC<NbProgressProps> = ({ label, value, color = '#FF6B6B' }) => {
  const clamped = Math.min(100, Math.max(0, value));

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.6px',
    fontWeight: 600,
    color: '#1A1A1A',
  };

  const trackStyle: React.CSSProperties = {
    height: '12px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    borderRadius: '9999px',
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${clamped}%`,
    background: color,
    borderRadius: '9999px',
    transition: 'width .3s ease',
  };

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
};

export default NbProgress;
