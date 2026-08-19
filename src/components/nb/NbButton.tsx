import React, { useState, useEffect } from 'react';

type NbButtonVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'outline' | 'ghost';
type NbButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface NbButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NbButtonVariant;
  size?: NbButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<NbButtonVariant, { background: string; color: string; border: string; boxShadow?: string }> = {
  primary:     { background: '#FF6B6B', color: '#1A1A1A', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' },
  secondary:   { background: '#A388EE', color: '#1A1A1A', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' },
  accent:      { background: '#4ECDC4', color: '#1A1A1A', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' },
  destructive: { background: '#FF4757', color: '#FFFFFF', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' },
  outline:     { background: '#FFFFFF', color: '#1A1A1A', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' },
  ghost:       { background: 'transparent', color: '#1A1A1A', border: 'none', boxShadow: 'none' },
};

const sizeStyles: Record<NbButtonSize, React.CSSProperties> = {
  sm:   { height: '36px', padding: '0 14px', fontSize: '13.6px' },
  md:   { height: '44px', padding: '0 22px', fontSize: '16px' },
  lg:   { height: '54px', padding: '0 30px', fontSize: '17.6px' },
  icon: { width: '40px', height: '40px', padding: '0' },
};

const Spinner: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: 'nb-spin 1s linear infinite' }}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.9" y1="4.9" x2="7.8" y2="7.8" />
    <line x1="16.2" y1="16.2" x2="19.1" y2="19.1" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.9" y1="19.1" x2="7.8" y2="16.2" />
    <line x1="16.2" y1="7.8" x2="19.1" y2="4.9" />
  </svg>
);

const NbButton: React.FC<NbButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}) => {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!document.getElementById('nb-keyframes')) {
      const el = document.createElement('style');
      el.id = 'nb-keyframes';
      el.textContent = `@keyframes nb-spin { to { transform: rotate(360deg); } } @keyframes nb-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }`;
      document.head.appendChild(el);
    }
  }, []);

  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  const isDisabled = disabled || loading;

  let transform = 'translate(0,0)';
  let boxShadow = vStyle.boxShadow ?? 'none';

  if (!isDisabled) {
    if (active) {
      transform = 'translate(2px,2px)';
      boxShadow = vStyle.boxShadow ? '2px 2px 0 #1A1A1A' : 'none';
    } else if (hovered) {
      transform = 'translate(-1px,-1px)';
      boxShadow = vStyle.boxShadow ? '5px 5px 0 #1A1A1A' : 'none';
    }
  }

  const computedStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    cursor: isDisabled ? (loading ? 'wait' : 'not-allowed') : 'pointer',
    opacity: isDisabled && !loading ? 0.5 : 1,
    transition: 'transform .1s, box-shadow .1s',
    transform,
    boxShadow,
    background: variant === 'ghost' && hovered ? 'rgba(26,26,26,0.08)' : vStyle.background,
    color: vStyle.color,
    border: vStyle.border,
    ...sStyle,
    ...style,
  };

  return (
    <button
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(false); }}
      onMouseDown={() => !isDisabled && setActive(true)}
      onMouseUp={() => setActive(false)}
      style={computedStyle}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default NbButton;
