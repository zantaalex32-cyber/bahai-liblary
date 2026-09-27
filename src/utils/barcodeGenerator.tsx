import React from 'react';

// Code128 pattern generator helper for SVG rendering
function encodeCode128B(text: string): string {
  // Simple deterministic pattern mapping for visual barcode rendering
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const str = Math.abs(hash).toString(2).padStart(32, '1');
  return '11010010000' + str + '1100011101011';
}

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showValueText?: boolean;
  className?: string;
}

export const BarcodeSVG: React.FC<BarcodeProps> = ({
  value,
  width = 220,
  height = 65,
  showValueText = true,
  className = '',
}) => {
  const codeBits = encodeCode128B(value || '00000000');
  const barWidth = width / codeBits.length;

  return (
    <div className={`flex flex-col items-center bg-white p-2 rounded border border-stone-200 select-none ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill="#ffffff" />
        {codeBits.split('').map((bit, idx) => {
          if (bit === '1') {
            return (
              <rect
                key={idx}
                x={idx * barWidth}
                y={4}
                width={barWidth + 0.2}
                height={height - (showValueText ? 20 : 8)}
                fill="#1c1917"
              />
            );
          }
          return null;
        })}
      </svg>
      {showValueText && (
        <span className="font-mono text-xs font-semibold tracking-wider text-stone-800 mt-1">
          {value}
        </span>
      )}
    </div>
  );
};

// Generates QR Code SVG representation
export const QRCodeSVG: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 100,
  className = '',
}) => {
  // Generate simple deterministic 12x12 grid QR-style pattern
  const gridSize = 12;
  const cellSize = size / gridSize;

  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }

  const cells: boolean[][] = Array(gridSize)
    .fill(0)
    .map(() => Array(gridSize).fill(false));

  // Finder patterns at top-left, top-right, bottom-left
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Top-left finder
      if (r < 3 && c < 3) {
        cells[r][c] = r === 0 || r === 2 || c === 0 || c === 2;
        continue;
      }
      // Top-right finder
      if (r < 3 && c >= gridSize - 3) {
        cells[r][c] = r === 0 || r === 2 || c === gridSize - 3 || c === gridSize - 1;
        continue;
      }
      // Bottom-left finder
      if (r >= gridSize - 3 && c < 3) {
        cells[r][c] = r === gridSize - 3 || r === gridSize - 1 || c === 0 || c === 2;
        continue;
      }

      // Hash data cells
      const idx = r * gridSize + c;
      cells[r][c] = ((hash + idx * 17) % 3) === 0;
    }
  }

  return (
    <div className={`p-2 bg-white rounded border border-stone-200 inline-block ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#ffffff" />
        {cells.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx * cellSize}
                y={rIdx * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#1c1917"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
