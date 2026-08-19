import React from 'react';

interface NbCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const CheckIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 6 5 9 10 3" />
  </svg>
);

const NbCheckbox: React.FC<NbCheckboxProps> = ({ checked, onChange, label, disabled }) => {
  const boxStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    background: checked ? '#FF6B6B' : '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .15s',
    cursor: disabled ? 'not-allowed' : 'pointer',
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

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#1A1A1A',
  };

  return (
    <label style={wrapperStyle}>
      <span
        style={boxStyle}
        onClick={() => !disabled && onChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) onChange(!checked);
        }}
      >
        {checked && <CheckIcon />}
      </span>
      <span style={labelStyle}>{label}</span>
    </label>
  );
};

export default NbCheckbox;
