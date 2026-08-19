import React, { useState } from 'react';

interface NbNavLink {
  label: string;
  href: string;
}

interface NbNavbarProps {
  brand: string;
  links?: NbNavLink[];
  action?: React.ReactNode;
}

const BoltIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1A1A1A">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const NbNavbar: React.FC<NbNavbarProps> = ({ brand, links = [], action }) => {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const navStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0 #1A1A1A',
    borderRadius: '8px',
  };

  const brandWrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const logoStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    background: '#FF6B6B',
    border: '2px solid #1A1A1A',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const brandTextStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1A1A1A',
    letterSpacing: '-0.3px',
  };

  const linksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  };

  return (
    <nav style={navStyle}>
      <div style={brandWrapStyle}>
        <div style={logoStyle}>
          <BoltIcon />
        </div>
        <span style={brandTextStyle}>{brand}</span>
      </div>

      {links.length > 0 && (
        <div style={linksStyle}>
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              style={{
                fontSize: '13.6px',
                fontWeight: 500,
                color: hoveredLink === i ? '#FF6B6B' : '#1A1A1A',
                textDecoration: 'none',
                transition: 'color .15s',
              }}
              onMouseEnter={() => setHoveredLink(i)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {action && <div>{action}</div>}
    </nav>
  );
};

export default NbNavbar;
