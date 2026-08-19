import React from 'react';

interface NbRadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NbRadioGroupProps {
  label?: string;
  options: NbRadioOption[];
  value: string;
  onChange: (value: string) => void;
}

const NbRadioGroup: React.FC<NbRadioGroupProps> = ({ label, options, value, onChange }) => {
  const groupStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const groupLabelStyle: React.CSSProperties = {
    fontSize: '13.6px',
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: '4px',
  };

  return (
    <div style={groupStyle}>
      {label && <span style={groupLabelStyle}>{label}</span>}
      {options.map((opt) => {
        const selected = opt.value === value;

        const rowStyle: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          cursor: opt.disabled ? 'not-allowed' : 'pointer',
          opacity: opt.disabled ? 0.5 : 1,
          userSelect: 'none',
        };

        const radioStyle: React.CSSProperties = {
          width: '20px',
          height: '20px',
          borderRadius: '9999px',
          border: '2px solid #1A1A1A',
          boxShadow: '2px 2px 0 #1A1A1A',
          background: selected ? '#A388EE' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background .15s',
        };

        const dotStyle: React.CSSProperties = {
          width: '8px',
          height: '8px',
          borderRadius: '9999px',
          background: '#1A1A1A',
          opacity: selected ? 1 : 0,
          transition: 'opacity .15s',
        };

        return (
          <label key={opt.value} style={rowStyle}>
            <span
              style={radioStyle}
              onClick={() => !opt.disabled && onChange(opt.value)}
              role="radio"
              aria-checked={selected}
              tabIndex={opt.disabled ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !opt.disabled) onChange(opt.value);
              }}
            >
              <span style={dotStyle} />
            </span>
            <span style={{ fontSize: '14px', color: '#1A1A1A' }}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};

export default NbRadioGroup;
