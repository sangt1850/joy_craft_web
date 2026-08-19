import React, { useEffect } from 'react';

interface NbSkeletonProps {
  variant?: 'circle' | 'text' | 'rect';
  width?: number | string;
  height?: number | string;
  className?: string;
}

const NbSkeleton: React.FC<NbSkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height = 16,
  className,
}) => {
  useEffect(() => {
    if (!document.getElementById('nb-keyframes')) {
      const el = document.createElement('style');
      el.id = 'nb-keyframes';
      el.textContent = `@keyframes nb-spin { to { transform: rotate(360deg); } } @keyframes nb-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }`;
      document.head.appendChild(el);
    }
  }, []);

  const borderRadius =
    variant === 'circle' ? '9999px' : variant === 'text' ? '4px' : '4px';

  const style: React.CSSProperties = {
    display: 'block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
    background: 'linear-gradient(90deg, #E8E0D4 25%, #F5EFE6 37%, #E8E0D4 63%)',
    backgroundSize: '400px 100%',
    animation: 'nb-shimmer 1.4s ease infinite',
  };

  return <span className={className} style={style} aria-hidden="true" />;
};

export default NbSkeleton;
