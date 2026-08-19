import React, { useState } from 'react';

interface NbSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const ChevronDownIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const NbSelect: React.FC<NbSelectProps> = ({ label, options, disabled, style, ...rest }) => {
  const [focused, setFocused] = useState(false);

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'inline-flex',
    flexDirection: 'column',
    gap: '6px',
    width: '320px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13.6px',
    fontWeight: 600,
    color: '#1A1A1A',
  };

  const selectWrapStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    width: '100%',
    height: '48px',
    padding: '10px 40px 10px 16px',
    border: '2px solid #1A1A1A',
    boxShadow: focused ? '6px 6px 0 #1A1A1A' : '4px 4px 0 #1A1A1A',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1A1A1A',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'box-shadow .15s',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#1A1A1A',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={selectWrapStyle}>
        <select
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={selectStyle}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span style={iconStyle}>
          <ChevronDownIcon />
        </span>
      </div>
    </div>
  );
};

export default NbSelect;
