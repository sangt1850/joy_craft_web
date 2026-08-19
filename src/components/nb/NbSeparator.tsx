import React from 'react';

interface NbSeparatorProps {
  label?: string;
  dashed?: boolean;
}

const NbSeparator: React.FC<NbSeparatorProps> = ({ label, dashed }) => {
  if (dashed) {
    return (
      <div
        style={{
          borderTop: '2px dashed #1A1A1A',
          height: 0,
          margin: '8px 0',
        }}
        role="separator"
      />
    );
  }

  if (label) {
    return (
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '8px 0',
        }}
        role="separator"
      >
        <span style={{ flex: 1, height: '2px', background: '#1A1A1A' }} />
        <span style={{ fontSize: '12.8px', color: '#6B6B6B', whiteSpace: 'nowrap', userSelect: 'none' }}>
          {label}
        </span>
        <span style={{ flex: 1, height: '2px', background: '#1A1A1A' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '2px',
        background: '#1A1A1A',
        margin: '8px 0',
      }}
      role="separator"
    />
  );
};

export default NbSeparator;
