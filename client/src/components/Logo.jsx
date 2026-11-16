import React from 'react';
import { playBusHorn } from '../utils/audio';

/**
 * CampusRide Brand Logo Component
 * Renders the official graphic logo badge image (`/logo.png`) across all modules.
 */
export const LogoGraphic = ({ size = 'md', className = '', enableSound = true }) => {
  const graphicSizes = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    xxl: 'h-36 w-36'
  };

  const handleTap = (e) => {
    e.stopPropagation();
    if (enableSound) {
      playBusHorn();
    }
  };

  return (
    <img 
      src="/logo.png" 
      alt="CampusRide Logo" 
      onClick={handleTap}
      title="Tap logo to honk bus horn!"
      className={`object-cover rounded-2xl shadow-md border border-amber-300/40 hover:scale-105 transition-transform duration-300 shrink-0 cursor-pointer ${graphicSizes[size] || graphicSizes.md} ${className}`}
    />
  );
};

const Logo = ({ 
  size = 'md', 
  variant = 'default', 
  subtext = 'Rohini College Transit',
  className = '',
  hideTextOnMobile = false,
  enableSound = true
}) => {
  if (variant === 'graphic' || variant === 'icon-only') {
    return <LogoGraphic size={size} className={className} enableSound={enableSound} />;
  }

  const titleSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-4xl sm:text-5xl'
  };

  const subtitleSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      <LogoGraphic size={size} enableSound={enableSound} />
      
      <div className={`flex flex-col ${hideTextOnMobile ? 'hidden sm:flex' : ''}`}>
        <span className={`font-black tracking-tight text-slate-900 flex items-center leading-none ${titleSizes[size] || titleSizes.md}`}>
          Campus<span className="text-amber-600 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent ml-0.5">Ride</span>
        </span>
        
        {subtext && (
          <span className={`tracking-widest text-amber-800 font-extrabold uppercase mt-1 ${subtitleSizes[size] || subtitleSizes.md}`}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
