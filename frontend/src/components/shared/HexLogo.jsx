import React from 'react';

export default function HexLogo({ size = 36, active = true }) {
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Architectural Hexagon */}
        <polygon 
          points="50,5 92,27 92,73 50,95 8,73 8,27" 
          fill="#EFECE6" 
          stroke="#1E1E1E" 
          strokeWidth="3.5" 
        />
        {/* Inner Survey Geometry Matrix */}
        <polygon 
          points="50,16 82,33 82,67 50,84 18,67 18,33" 
          fill="none" 
          stroke="#8D8574" 
          strokeWidth="2" 
          strokeDasharray="4 3"
        />
        {/* Radial Axis Crosshairs */}
        <line x1="50" y1="18" x2="50" y2="82" stroke="#655E4E" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="#655E4E" strokeWidth="1" strokeOpacity="0.4" />
        {/* Warm Amber / Gold Focal Core */}
        <circle cx="50" cy="50" r="11" fill="#1E1E1E" />
        <circle cx="50" cy="50" r="8" fill="#D97706" className={active ? "animate-pulse" : ""} />
        <circle cx="50" cy="50" r="3" fill="#FAF9F5" />
      </svg>
    </div>
  );
}
