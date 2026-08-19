import React from 'react';

type NbAlertVariant = 'info' | 'success' | 'warning' | 'error';

interface NbAlertProps {
  variant: NbAlertVariant;
  title: string;
  description?: string;
}

const variantBg: Record<NbAlertVariant, string> = {
  info:    'rgba(69,183,209,0.2)',
  success: 'rgba(78,205,196,0.2)',
  warning: '#FFE66D',
  error:   'rgba(255,107,107,0.3)',
};

const InfoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#45B7D1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const icons: Record<NbAlertVariant, React.ReactNode> = {
  info:    <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error:   <ErrorIcon />,
};

const NbAlert: React.FC<NbAlertProps> = ({ variant, title, description }) => {
  const alertStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    gap: '14px',
    alignItems: description ? 'flex-start' : 'center',
    padding: '20px',
    background: variantBg[variant],
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0 #1A1A1A',
    borderRadius: '8px',
  };

  const textWrapStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1A1A1A',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '13.6px',
    color: '#6B6B6B',
    lineHeight: 1.5,
  };

  return (
    <div style={alertStyle} role="alert">
      {icons[variant]}
      <div style={textWrapStyle}>
        <span style={titleStyle}>{title}</span>
        {description && <span style={descStyle}>{description}</span>}
      </div>
    </div>
  );
};

export default NbAlert;
