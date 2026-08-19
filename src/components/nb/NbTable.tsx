import React, { useState } from 'react';

interface NbTableColumn {
  key: string;
  header: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface NbTableProps {
  columns: NbTableColumn[];
  data: Record<string, unknown>[];
}

const NbTable: React.FC<NbTableProps> = ({ columns, data }) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const tableStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    width: '100%',
    border: '2px solid #1A1A1A',
    borderRadius: '8px',
    boxShadow: '4px 4px 0 #1A1A1A',
    overflow: 'hidden',
    borderCollapse: 'separate',
    borderSpacing: 0,
  };

  const theadStyle: React.CSSProperties = {
    background: '#FFE66D',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '13.6px',
    fontWeight: 700,
    color: '#1A1A1A',
    borderBottom: '2px solid #1A1A1A',
  };

  return (
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={thStyle}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => {
          const isLast = i === data.length - 1;
          const isHovered = hoveredRow === i;

          const rowStyle: React.CSSProperties = {
            background: isHovered ? 'rgba(26,26,26,0.04)' : '#FFFFFF',
            transition: 'background .1s',
          };

          const tdStyle: React.CSSProperties = {
            padding: '12px 16px',
            fontSize: '14px',
            color: '#1A1A1A',
            borderBottom: isLast ? 'none' : '2px solid #1A1A1A',
          };

          return (
            <tr
              key={i}
              style={rowStyle}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {columns.map((col) => (
                <td key={col.key} style={tdStyle}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default NbTable;
