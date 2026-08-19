import React, { useState } from 'react';

interface NbTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const NbTextarea: React.FC<NbTextareaProps> = ({ label, error, disabled, style, ...rest }) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? '#FF4757' : '#1A1A1A';
  const shadowColor = error ? '#FF4757' : '#1A1A1A';
  const shadowSize = focused ? `6px 6px 0 ${shadowColor}` : `4px 4px 0 ${shadowColor}`;

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'inline-flex',
    flexDirection: 'column',
    gap: '6px',
    width: '384px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13.6px',
    fontWeight: 600,
    color: '#1A1A1A',
  };

  const textareaStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    width: '100%',
    height: '96px',
    padding: '12px 16px',
    border: `2px solid ${borderColor}`,
    boxShadow: shadowSize,
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1A1A1A',
    background: '#FFFFFF',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'box-shadow .15s, border-color .15s',
    ...style,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12.8px',
    color: '#FF4757',
    marginTop: '4px',
  };

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <textarea
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={textareaStyle}
        {...rest}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default NbTextarea;
