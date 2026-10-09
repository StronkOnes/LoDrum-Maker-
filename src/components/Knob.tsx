/**
 * LoDrum Maker - Precision Hardware Rotary Knob
 * The Plugin Foundry
 * Interactive drag, mouse-wheel, double-click reset, radial LED arc, and tabular readout
 */

import React, { useRef, useState, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number;            // 0 - 100 or min - max
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  color?: 'amber' | 'cyan' | 'copper';
  size?: 'sm' | 'md' | 'lg';
  onChange: (val: number) => void;
  displayValue?: string;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  unit = '',
  color = 'amber',
  size = 'md',
  onChange,
  displayValue
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  // Knob sizes
  const dimensions = {
    sm: { size: 48, radius: 20, stroke: 3, font: 'text-[10px]' },
    md: { size: 60, radius: 24, stroke: 3.5, font: 'text-xs' },
    lg: { size: 76, radius: 31, stroke: 4.5, font: 'text-sm' }
  }[size];

  // Normalized 0.0 to 1.0
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Angles: from -135deg to +135deg (total 270 degrees)
  const startAngle = -135;
  const endAngle = 135;
  const currentAngle = startAngle + normalized * (endAngle - startAngle);

  // SVG arc calculation
  const circumference = 2 * Math.PI * dimensions.radius;
  const arcLength = (270 / 360) * circumference;
  const strokeDashoffset = arcLength - normalized * arcLength;

  const colorStyles = {
    amber: {
      arc: '#f59e0b',
      glow: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))',
      dot: '#fbbf24',
      bgGlow: 'hover:border-amber-500/40'
    },
    cyan: {
      arc: '#06b6d4',
      glow: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))',
      dot: '#22d3ee',
      bgGlow: 'hover:border-cyan-500/40'
    },
    copper: {
      arc: '#d97706',
      glow: 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.4))',
      dot: '#f59e0b',
      bgGlow: 'hover:border-amber-600/40'
    }
  }[color];

  // Pointer drag events
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - e.clientY;
    const sensitivity = e.shiftKey ? 0.001 : 0.004; // Shift for fine-tuning
    const range = max - min;
    let nextVal = startValRef.current + deltaY * range * sensitivity;

    if (step > 0) {
      nextVal = Math.round(nextVal / step) * step;
    }
    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(nextVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step || 1 : -(step || 1);
    const range = max - min;
    const stepSize = e.shiftKey ? (range / 100) : (range / 40);
    const change = delta > 0 ? stepSize : -stepSize;
    let nextVal = value + change;
    if (step > 0) {
      nextVal = Math.round(nextVal / step) * step;
    }
    onChange(Math.max(min, Math.min(max, nextVal)));
  };

  // Double click reset
  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className="flex flex-col items-center select-none group">
      <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 group-hover:text-neutral-200 transition-colors mb-1.5 whitespace-nowrap">
        {label}
      </span>

      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className={`relative cursor-ns-resize touch-none flex items-center justify-center rounded-full bg-[#12141a] border border-[#232733] ${colorStyles.bgGlow} transition-all duration-150 ${
          isDragging ? 'scale-[1.03] shadow-lg border-neutral-600' : ''
        }`}
        style={{ width: dimensions.size, height: dimensions.size }}
        title={`${label}: ${displayValue || value}${unit} (Drag up/down, Scroll, Double-click to reset)`}
      >
        {/* SVG Arc Ring */}
        <svg
          width={dimensions.size}
          height={dimensions.size}
          className="absolute inset-0 -rotate-90 pointer-events-none"
        >
          {/* Background track */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            fill="none"
            stroke="#1b1f2b"
            strokeWidth={dimensions.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${45} ${dimensions.size / 2} ${dimensions.size / 2})`}
          />
          {/* Active LED track */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            fill="none"
            stroke={colorStyles.arc}
            strokeWidth={dimensions.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ filter: isDragging ? colorStyles.glow : 'none' }}
            transform={`rotate(${45} ${dimensions.size / 2} ${dimensions.size / 2})`}
          />
        </svg>

        {/* Inner Knob Cap */}
        <div
          className="relative rounded-full bg-gradient-to-b from-[#252a37] to-[#151720] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center border border-[#303646]"
          style={{
            width: dimensions.size - dimensions.stroke * 3.5,
            height: dimensions.size - dimensions.stroke * 3.5,
            transform: `rotate(${currentAngle}deg)`
          }}
        >
          {/* Top notch indicator */}
          <div
            className="absolute top-1 w-[2.5px] rounded-full shadow-sm"
            style={{
              height: dimensions.size * 0.2,
              backgroundColor: colorStyles.dot
            }}
          />
        </div>
      </div>

      {/* Readout value */}
      <span className="mt-1.5 font-mono text-[10px] text-neutral-300 tabular-nums">
        {displayValue ?? (Math.round(value * 10) / 10)}
        {unit}
      </span>
    </div>
  );
};
