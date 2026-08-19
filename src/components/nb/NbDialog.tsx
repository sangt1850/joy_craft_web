import React from 'react';

interface NbDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const NbDialog: React.FC<NbDialogProps> = ({
  open,
  onClose,
  title,
  description,
  icon,
  actions,
  children,
}) => {
  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const panelStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    maxWidth: '320px',
    width: '90%',
    padding: '22px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '6px 6px 0 #1A1A1A',
    borderRadius: '8px',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1A1A1A',
    marginBottom: description ? '8px' : '16px',
    display: 'flex',
    alignItems: 'center',
    gap: icon ? '10px' : undefined,
  };

  const descStyle: React.CSSProperties = {
    fontSize: '13.6px',
    color: '#6B6B6B',
    marginBottom: '20px',
    lineHeight: 1.6,
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={titleStyle}>
          {icon}
          {title}
        </div>
        {description && <p style={descStyle}>{description}</p>}
        {children}
        {actions && <div style={actionsStyle}>{actions}</div>}
      </div>
    </div>
  );
};

export default NbDialog;
