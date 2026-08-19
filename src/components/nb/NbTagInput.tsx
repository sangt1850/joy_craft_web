import React, { useState, useRef } from 'react';

interface NbTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const NbTagInput: React.FC<NbTagInputProps> = ({ tags, onChange, placeholder = '태그 추가...' }) => {
  const [input, setInput] = useState('');
  const [hoveredTag, setHoveredTag] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px 16px',
    background: '#FFFFFF',
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0 #1A1A1A',
    borderRadius: '8px',
    cursor: 'text',
    minHeight: '52px',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    border: 'none',
    outline: 'none',
    flex: 1,
    minWidth: '100px',
    fontSize: '14px',
    color: '#1A1A1A',
    background: 'transparent',
  };

  return (
    <div style={wrapperStyle} onClick={() => inputRef.current?.focus()}>
      {tags.map((tag, i) => {
        const tagStyle: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#A388EE',
          border: '2px solid #1A1A1A',
          borderRadius: '9999px',
          padding: '4px 10px 4px 12px',
          fontSize: '12.8px',
          fontWeight: 600,
          color: '#1A1A1A',
          whiteSpace: 'nowrap',
        };

        const removeStyle: React.CSSProperties = {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: '14px',
          fontWeight: 700,
          color: hoveredTag === i ? '#FF4757' : '#1A1A1A',
          transition: 'color .15s',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        };

        return (
          <span key={i} style={tagStyle}>
            {tag}
            <button
              style={removeStyle}
              onClick={() => removeTag(i)}
              onMouseEnter={() => setHoveredTag(i)}
              onMouseLeave={() => setHoveredTag(null)}
              tabIndex={-1}
            >
              ✕
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={inputStyle}
      />
    </div>
  );
};

export default NbTagInput;
