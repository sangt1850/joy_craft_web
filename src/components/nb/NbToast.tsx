import React, { useState } from 'react';

type NbToastType = 'success' | 'info' | 'error';

interface NbToastItem {
  id: number | string;
  type: NbToastType;
  text: string;
}

interface NbToastListProps {
  toasts: NbToastItem[];
  onDismiss: (id: number | string) => void;
}

const toastBg: Record<NbToastType, string> = {
  success: '#4ECDC4',
  info: '#FFE66D',
  error: '#FF6B6B',
};

const SuccessIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const typeIcon: Record<NbToastType, React.ReactNode> = {
  success: <SuccessIcon />,
  info: <InfoIcon />,
  error: <ErrorIcon />,
};

const NbToastList: React.FC<NbToastListProps> = ({ toasts, onDismiss }) => {
  const [hoveredClose, setHoveredClose] = useState<number | string | null>(null);

  const listStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={listStyle}>
      {toasts.map((toast) => {
        const toastStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 16px',
          border: '2px solid #1A1A1A',
          boxShadow: '4px 4px 0 #1A1A1A',
          borderRadius: '8px',
          marginBottom: '12px',
          background: toastBg[toast.type],
          fontSize: '13.6px',
          fontWeight: 500,
          color: '#1A1A1A',
        };

        const leftStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        };

        const closeStyle: React.CSSProperties = {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 700,
          color: '#1A1A1A',
          opacity: hoveredClose === toast.id ? 0.6 : 1,
          transition: 'opacity .15s',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        };

        return (
          <div key={toast.id} style={toastStyle}>
            <div style={leftStyle}>
              {typeIcon[toast.type]}
              <span>{toast.text}</span>
            </div>
            <button
              style={closeStyle}
              onClick={() => onDismiss(toast.id)}
              onMouseEnter={() => setHoveredClose(toast.id)}
              onMouseLeave={() => setHoveredClose(null)}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NbToastList;
export type { NbToastItem, NbToastType };
