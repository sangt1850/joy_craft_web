import React from 'react';

interface NbSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  color?: string;
  disabled?: boolean;
}

const NbSwitch: React.FC<NbSwitchProps> = ({
  checked,
  onChange,
  label,
  color = '#4ECDC4',
  disabled,
}) => {
  const trackStyle: React.CSSProperties = {
    width: '48px',
    height: '28px',
    borderRadius: '9999px',
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    background: checked ? color : '#E8E0D4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: checked ? 'flex-end' : 'flex-start',
    padding: '3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background .15s',
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  const dotStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    flexShrink: 0,
  };

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
  };

  return (
    <label style={wrapperStyle}>
      <span
        style={trackStyle}
        onClick={() => !disabled && onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) onChange(!checked);
        }}
      >
        <span style={dotStyle} />
      </span>
      {label && <span style={{ fontSize: '14px', color: '#1A1A1A' }}>{label}</span>}
    </label>
  );
};

export default NbSwitch;
