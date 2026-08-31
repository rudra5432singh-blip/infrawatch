import React from 'react';

export default function HexLogo({ size = 36, active = true }) {
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon 
          points="50,5 92,27 92,73 50,95 8,73 8,27" 
          fill="#EEF2FF" 
          stroke="#C7D2FE" 
          strokeWidth="4" 
        />
        <polygon 
          points="50,15 82,32 82,68 50,85 18,68 18,32" 
          fill="none" 
          stroke="#4F46E5" 
          strokeWidth="3" 
          strokeDasharray="4 2"
        />
        <circle cx="50" cy="50" r="12" fill="#4F46E5" className={active ? "animate-pulse" : ""} />
        <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
