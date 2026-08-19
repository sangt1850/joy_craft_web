import React, { useState } from 'react';
import NbInput from './NbInput';

interface NbPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const EyeOpenIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const NbPasswordInput: React.FC<NbPasswordInputProps> = ({ label, error, ...rest }) => {
  const [visible, setVisible] = useState(false);

  const toggleStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: '#6B6B6B',
    display: 'flex',
    alignItems: 'center',
  };

  const toggle = (
    <button type="button" style={toggleStyle} onClick={() => setVisible((v) => !v)} tabIndex={-1}>
      {visible ? <EyeOffIcon /> : <EyeOpenIcon />}
    </button>
  );

  return (
    <NbInput
      label={label}
      error={error}
      type={visible ? 'text' : 'password'}
      rightElement={toggle}
      {...rest}
    />
  );
};

export default NbPasswordInput;
