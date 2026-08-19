import React, { useState } from 'react';

type NbBadgeVariant = 'default' | 'secondary' | 'accent' | 'destructive' | 'outline';

interface NbBadgeProps {
  variant?: NbBadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<NbBadgeVariant, { background: string; color: string }> = {
  default:     { background: '#FF6B6B', color: '#1A1A1A' },
  secondary:   { background: '#A388EE', color: '#1A1A1A' },
  accent:      { background: '#4ECDC4', color: '#1A1A1A' },
  destructive: { background: '#FF4757', color: '#FFFFFF' },
  outline:     { background: '#FFFFFF', color: '#1A1A1A' },
};

const NbBadge: React.FC<NbBadgeProps> = ({ variant = 'default', children, icon, className }) => {
  const [hovered, setHovered] = useState(false);
  const v = variantStyles[variant];

  const style: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    gap: icon ? '6px' : undefined,
    borderRadius: '9999px',
    padding: '4px 12px',
    fontSize: '12.8px',
    fontWeight: 600,
    background: v.background,
    color: v.color,
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    transform: hovered ? 'translate(-1px,-1px)' : 'translate(0,0)',
    transition: 'transform .1s',
    cursor: 'default',
    userSelect: 'none',
  };

  return (
    <span
      className={className}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      {children}
    </span>
  );
};

export default NbBadge;
