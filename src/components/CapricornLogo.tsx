import React from 'react';

interface CapricornLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  color?: string;
  textColor?: string;
  id?: string;
}

export function CapricornIcon({
  className = "w-6 h-6",
  color = "#D9822B",
  id = "capricorn-icon"
}: {
  className?: string;
  color?: string;
  id?: string;
}) {
  return (
    <svg
      id={id}
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Capricorn Logo"
    >
      <g
        transform="rotate(45 200 200)"
        stroke={color}
        strokeWidth="36"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      >
        {/* Outer Top-Left Angle & Rail */}
        <polyline points="50,270 50,10 300,10" />
        {/* Inner Top-Left Angle & Rail */}
        <polyline points="112,208 112,72 238,72" />
        {/* Outer Bottom-Right Angle & Rail */}
        <polyline points="350,130 350,390 100,390" />
        {/* Inner Bottom-Right Angle & Rail */}
        <polyline points="288,192 288,328 162,328" />
      </g>
    </svg>
  );
}

export default function CapricornLogo({
  className = "h-8",
  showText = true,
  color = "#D9822B",
  textColor = "#D9822B",
  id = "capricorn-logo"
}: CapricornLogoProps) {
  if (!showText) {
    return <CapricornIcon id={id} className={className} color={color} />;
  }

  return (
    <div id={id} className={`flex items-center gap-2.5 ${className}`}>
      <CapricornIcon className="w-8 h-8 flex-shrink-0" color={color} />
      <span
        style={{ color: textColor }}
        className="font-sans font-extrabold text-base tracking-[0.18em] uppercase select-none"
      >
        CAPRICORN
      </span>
    </div>
  );
}
