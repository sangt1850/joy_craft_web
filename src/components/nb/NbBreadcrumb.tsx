import React from 'react';

interface NbBreadcrumbItem {
  label: string;
  href?: string;
}

interface NbBreadcrumbProps {
  items: NbBreadcrumbItem[];
}

const NbBreadcrumb: React.FC<NbBreadcrumbProps> = ({ items }) => {
  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    borderRadius: '8px',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const separatorStyle: React.CSSProperties = {
    color: '#6B6B6B',
    fontSize: '13.6px',
    userSelect: 'none',
  };

  const linkStyle: React.CSSProperties = {
    fontSize: '13.6px',
    color: '#FF6B6B',
    textDecoration: 'none',
    fontWeight: 500,
  };

  const currentStyle: React.CSSProperties = {
    fontSize: '13.6px',
    color: '#1A1A1A',
    fontWeight: 600,
  };

  return (
    <nav style={wrapperStyle} aria-label="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {isLast ? (
              <span style={currentStyle}>{item.label}</span>
            ) : (
              <a href={item.href ?? '#'} style={linkStyle}>
                {item.label}
              </a>
            )}
            {!isLast && <span style={separatorStyle}>&gt;</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default NbBreadcrumb;
