import React, { useState } from 'react';

export default function HexLogo({ size = 36, active = true, showRing = true }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 select-none group" 
      style={{ width: size, height: size }}
    >
      {!imgFailed ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle architectural outer halo ring */}
          {showRing && (
            <div className="absolute inset-0 rounded-full border border-[rgba(61,58,52,0.18)] group-hover:border-[#D97706]/50 transition-colors shadow-2xs" />
          )}
          
          <img 
            src="/logo.png" 
            alt="INFRAWATCH Logo" 
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover rounded-full p-0.5"
          />

          {/* Precision Active Surveillance Pulse Dot */}
          {active && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706] border border-[#FAF9F5]"></span>
            </span>
          )}
        </div>
      ) : (
        /* Precise Geometric Vector Architectural Emblem Fallback */
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#FAF9F5" stroke="#1E1E1E" strokeWidth="3" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#8D8574" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="28" fill="#EFECE6" stroke="#1E1E1E" strokeWidth="2" />
          {/* Compass crosshairs */}
          <line x1="50" y1="6" x2="50" y2="94" stroke="#655E4E" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="6" y1="50" x2="94" y2="50" stroke="#655E4E" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Center Amber Gem */}
          <polygon points="50,36 62,50 50,64 38,50" fill="#D97706" stroke="#1E1E1E" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="3" fill="#FAF9F5" />
        </svg>
      )}
    </div>
  );
}
