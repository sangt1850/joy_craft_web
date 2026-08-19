import React, { useState } from 'react';

interface NbAvatarProps {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface NbAvatarGroupProps {
  avatars: { initials: string; color?: string }[];
  max?: number;
}

const sizePx: Record<'sm' | 'md' | 'lg', number> = {
  sm: 32,
  md: 40,
  lg: 52,
};

const fontSizePx: Record<'sm' | 'md' | 'lg', number> = {
  sm: 12,
  md: 14,
  lg: 18,
};

export const NbAvatar: React.FC<NbAvatarProps> = ({
  initials,
  color = '#FF6B6B',
  size = 'md',
}) => {
  const px = sizePx[size];
  const fs = fontSizePx[size];

  const style: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    width: `${px}px`,
    height: `${px}px`,
    borderRadius: '9999px',
    background: color,
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${fs}px`,
    fontWeight: 700,
    color: '#1A1A1A',
    flexShrink: 0,
    userSelect: 'none',
    letterSpacing: '0.5px',
  };

  return <span style={style}>{initials.slice(0, 2).toUpperCase()}</span>;
};

const AVATAR_COLORS = ['#FF6B6B', '#A388EE', '#4ECDC4', '#FFE66D', '#45B7D1', '#F7A072'];

export const NbAvatarGroup: React.FC<NbAvatarGroupProps> = ({ avatars, max = 4 }) => {
  const [hovered, setHovered] = useState(false);

  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  const groupStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
  };

  return (
    <div
      style={groupStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {visible.map((av, i) => {
        const itemStyle: React.CSSProperties = {
          marginLeft: i === 0 ? 0 : '-10px',
          transition: 'transform .15s',
          transform: hovered ? `translateX(${i * 4}px)` : 'translateX(0)',
          zIndex: visible.length - i,
          position: 'relative',
        };

        return (
          <span key={i} style={itemStyle}>
            <NbAvatar
              initials={av.initials}
              color={av.color ?? AVATAR_COLORS[i % AVATAR_COLORS.length]}
              size="md"
            />
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          style={{
            marginLeft: '-10px',
            zIndex: 0,
            position: 'relative',
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              background: '#E8E0D4',
              border: '2px solid #1A1A1A',
              boxShadow: '2px 2px 0 #1A1A1A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12.8px',
              fontWeight: 700,
              color: '#1A1A1A',
            }}
          >
            +{overflow}
          </span>
        </span>
      )}
    </div>
  );
};

export default NbAvatar;
