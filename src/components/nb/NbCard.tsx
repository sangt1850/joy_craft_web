import React, { useState } from 'react';

interface NbCardProps {
  bg?: string;
  shadow?: 'sm' | 'md' | 'lg';
  padding?: number;
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const shadowMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: '2px 2px 0 #1A1A1A',
  md: '4px 4px 0 #1A1A1A',
  lg: '6px 6px 0 #1A1A1A',
};

const hoverShadowMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: '4px 4px 0 #1A1A1A',
  md: '6px 6px 0 #1A1A1A',
  lg: '8px 8px 0 #1A1A1A',
};

const NbCard: React.FC<NbCardProps> = ({
  bg = '#FFFFFF',
  shadow = 'md',
  padding = 20,
  hover = false,
  children,
  className,
  style,
}) => {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    background: bg,
    border: '2px solid #1A1A1A',
    boxShadow: hover && hovered ? hoverShadowMap[shadow] : shadowMap[shadow],
    borderRadius: '8px',
    padding: `${padding}px`,
    transform: hover && hovered ? 'translate(-2px,-2px)' : 'translate(0,0)',
    transition: 'transform .15s, box-shadow .15s',
    cursor: hover ? 'pointer' : undefined,
    ...style,
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
    >
      {children}
    </div>
  );
};

export default NbCard;
