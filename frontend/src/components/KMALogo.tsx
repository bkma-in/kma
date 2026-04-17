import React from 'react';

interface KMALogoProps {
  className?: string;
  size?: number;
}

const KMALogo: React.FC<KMALogoProps> = ({ className = "", size = 120 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Octagonal Outer Frame */}
        <path
          d="M200 20 L327.28 72.72 L380 200 L327.28 327.28 L200 380 L72.72 327.28 L20 200 L72.72 72.72 Z"
          stroke="black"
          strokeWidth="12"
          fill="white"
        />
        
        {/* Inner Circle */}
        <circle cx="200" cy="200" r="110" stroke="black" strokeWidth="6" />
        
        {/* Radiating Points (8-pointed star/compass feel) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path
            key={angle}
            d="M200 65 L225 105 L175 105 Z"
            fill="black"
            transform={`rotate(${angle} 200 200)`}
          />
        ))}

        {/* Association Text */}
        <foreignObject x="110" y="145" width="180" height="110">
          <div className="flex flex-col items-center justify-center h-full text-center leading-tight">
            <span className="font-bold text-[18px] uppercase tracking-tight text-black">Kerala</span>
            <span className="font-bold text-[18px] uppercase tracking-tight text-black">Mathematical</span>
            <span className="font-bold text-[18px] uppercase tracking-tight text-black">Association</span>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default KMALogo;
