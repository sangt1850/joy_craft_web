import React, { useState } from 'react';

interface NbInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const NbInput: React.FC<NbInputProps> = ({
  label,
  error,
  icon,
  rightElement,
  disabled,
  style,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? '#FF4757' : '#1A1A1A';
  const shadowColor = error ? '#FF4757' : '#1A1A1A';
  const shadowSize = focused ? `6px 6px 0 ${shadowColor}` : `4px 4px 0 ${shadowColor}`;

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

  const inputWrapStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    width: '100%',
    height: '48px',
    padding: `10px ${rightElement ? '40px' : '16px'} 10px ${icon ? '40px' : '16px'}`,
    border: `2px solid ${borderColor}`,
    boxShadow: shadowSize,
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1A1A1A',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'box-shadow .15s, border-color .15s',
    ...style,
  };

  const iconWrapStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#6B6B6B',
    display: 'flex',
    alignItems: 'center',
  };

  const rightWrapStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12.8px',
    color: '#FF4757',
    marginTop: '4px',
  };

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapStyle}>
        {icon && <span style={iconWrapStyle}>{icon}</span>}
        <input
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputStyle}
          {...rest}
        />
        {rightElement && <span style={rightWrapStyle}>{rightElement}</span>}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default NbInput;
