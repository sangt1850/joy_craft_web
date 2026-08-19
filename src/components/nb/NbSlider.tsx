import React, { useEffect, useId } from 'react';

interface NbSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

const NbSlider: React.FC<NbSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  color = '#FF6B6B',
}) => {
  const uid = useId().replace(/:/g, '');
  const styleId = `nb-slider-${uid}`;

  const percent = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style');
      el.id = styleId;
      el.textContent = `
        #nb-slider-input-${uid}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 2px solid #1A1A1A;
          box-shadow: 2px 2px 0 #1A1A1A;
          cursor: pointer;
          margin-top: -5px;
        }
        #nb-slider-input-${uid}::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 2px solid #1A1A1A;
          box-shadow: 2px 2px 0 #1A1A1A;
          cursor: pointer;
        }
        #nb-slider-input-${uid}::-webkit-slider-runnable-track {
          height: 12px;
          border-radius: 9999px;
        }
      `;
      document.head.appendChild(el);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [styleId, uid]);

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.6px',
    fontWeight: 600,
    color: '#1A1A1A',
  };

  const rangeStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: '12px',
    borderRadius: '9999px',
    border: '2px solid #1A1A1A',
    boxShadow: '2px 2px 0 #1A1A1A',
    background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, #E8E0D4 ${percent}%, #E8E0D4 100%)`,
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        id={`nb-slider-input-${uid}`}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={rangeStyle}
      />
    </div>
  );
};

export default NbSlider;
