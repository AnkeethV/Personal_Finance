import { useState } from 'react';
import './PercentageStackedBar.css';

// Helper to convert hex to HSL
function hexToHsl(hex) {
  let c = (hex || '#1C6B3A').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Generate monochromatic shades from darkest (highest %) to lightest (least %)
function generateMonochromeShades(baseColorHex, count) {
  if (count <= 0) return [];
  const { h, s } = hexToHsl(baseColorHex);

  if (count === 1) {
    return [{
      color: `hsl(${h}, ${Math.min(s, 70)}%, 34%)`,
      isLight: false
    }];
  }

  // Range from darkest (24% lightness) to lightest (62% lightness)
  // Ensures white text on all slices remains high-contrast, crisp, and consistent
  const minL = 24;
  const maxL = 62;

  const shades = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0 (highest) to 1 (lowest)
    const lightness = Math.round(minL + t * (maxL - minL));
    const saturation = Math.round(Math.max(38, s - t * 14));
    shades.push({
      color: `hsl(${h}, ${saturation}%, ${lightness}%)`,
      isLight: false
    });
  }
  return shades;
}

export default function PercentageStackedBar({
  items = [],
  formatCurrency,
  emptyMessage = 'No data available this month.',
  title,
  headerAction,
  baseColor = '#1C6B3A',
  showLegend = true
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Filter items with amount > 0 and ensure sorted descending by amount
  const validItems = [...items]
    .filter(item => (item.amount || 0) > 0)
    .sort((a, b) => b.amount - a.amount);

  // Generate monochromatic shades from darkest (highest %) to lightest (least %)
  const shades = generateMonochromeShades(baseColor, validItems.length);
  const shadedItems = validItems.map((item, index) => ({
    ...item,
    color: shades[index]?.color || item.color,
    isLight: shades[index]?.isLight || false
  }));

  const formatPercentage = (amount) => {
    if (totalAmount === 0) return '0%';
    const pct = (amount / totalAmount) * 100;
    if (pct >= 10 || Number.isInteger(pct)) {
      return `${Math.round(pct)}%`;
    }
    return `${pct.toFixed(1)}%`;
  };

  const getExactPercentage = (amount) => {
    if (totalAmount === 0) return 0;
    return (amount / totalAmount) * 100;
  };

  // Precompute cumulative positions for tooltip centering
  let cumulative = 0;
  const segmentsWithPos = shadedItems.map((item, index) => {
    const pct = getExactPercentage(item.amount);
    const start = cumulative;
    cumulative += pct;
    const center = Math.min(92, Math.max(8, start + pct / 2));
    return { ...item, index, pct, start, center };
  });

  const activeSegment = hoveredIndex !== null ? segmentsWithPos[hoveredIndex] : null;

  return (
    <div className={`percentage-stacked-card ${!showLegend ? 'no-legend' : ''}`}>
      {/* Card Header: Title on left, optional action (e.g. View All) on right */}
      {(title || headerAction) && (
        <div className="stacked-card-header">
          {title && <h2 className="font-display section-title">{title}</h2>}
          {headerAction && <div className="header-action-wrapper">{headerAction}</div>}
        </div>
      )}

      {shadedItems.length === 0 ? (
        <div className="empty-chart">{emptyMessage}</div>
      ) : (
        <div className="stacked-chart-container">
          {/* 100% Proportional Stacked Bar with Floating Tooltip */}
          <div className="stacked-track-wrapper">
            {activeSegment && (
              <div
                className="stacked-floating-tooltip"
                style={{ left: `${activeSegment.center}%` }}
              >
                <div className="tooltip-inner">
                  <span
                    className="tooltip-dot"
                    style={{ backgroundColor: activeSegment.color }}
                  />
                  <span className="tooltip-name">{activeSegment.name}</span>
                  <span className="tooltip-pct font-mono">
                    {formatPercentage(activeSegment.amount)}
                  </span>
                  <span className="tooltip-amount font-mono">
                    {formatCurrency(activeSegment.amount)}
                  </span>
                </div>
                <div className="tooltip-pointer" />
              </div>
            )}

            <div
              className="stacked-bar-track"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {segmentsWithPos.map((item) => {
                const isHovered = hoveredIndex === item.index;
                const hasHover = hoveredIndex !== null;
                const roundedPct = Math.round(item.pct);

                return (
                  <div
                    key={item.index}
                    className={`stacked-segment ${isHovered ? 'hovered' : ''} ${hasHover && !isHovered ? 'dimmed' : ''}`}
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                    onMouseEnter={() => setHoveredIndex(item.index)}
                    onMouseOver={() => setHoveredIndex(item.index)}
                    onPointerEnter={() => setHoveredIndex(item.index)}
                    onTouchStart={() => setHoveredIndex(item.index)}
                    title={`${item.name}: ${formatPercentage(item.amount)} (${formatCurrency(item.amount)})`}
                  >
                    {/* Display integer percentage inside bar only if >= 2% and wide enough */}
                    {roundedPct >= 2 && (
                      <span
                        className="segment-percentage font-mono"
                        style={{
                          fontSize: item.pct < 4 ? '8.5px' : item.pct < 6 ? '9px' : item.pct < 9 ? '10px' : '11px',
                          letterSpacing: item.pct < 4 ? '-0.6px' : item.pct < 7 ? '-0.5px' : '-0.2px',
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.7)'
                        }}
                      >
                        {roundedPct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Item Breakdown / Legend (optional) */}
          {showLegend && (
            <div className="stacked-legend-list">
              {shadedItems.map((item, index) => {
                const isHovered = hoveredIndex === index;
                return (
                  <div
                    key={index}
                    className={`stacked-legend-row ${isHovered ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseOver={() => setHoveredIndex(index)}
                    onPointerEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(index)}
                  >
                    <div className="legend-row-left">
                      <span
                        className="legend-color-dot"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="legend-item-name" title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    <div className="legend-row-right">
                      <span className="legend-pct-badge font-mono">
                        {formatPercentage(item.amount)}
                      </span>
                      <span className="legend-amount font-mono">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
