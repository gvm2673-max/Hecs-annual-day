import React from 'react';

/**
 * HECS Enterprise Design Tokens & Branding Configuration
 * Pure White (#FFFFFF) & Professional Green (#16834A) Theme
 */

export const HECS_LOGO_URL = 'https://hecs.in/storage/logo/hecs-logo-1.png';

export const THEME = {
  colors: {
    primaryBg: '#FFFFFF',
    secondaryBg: '#F1F8F2',
    primaryGreen: '#16834A',
    secondaryGreen: '#27AE60',
    hoverGreen: '#136f3e',
    darkGreen: '#0f5932',
    darkText: '#1F2937',
    mutedText: '#6B7280',
    border: '#E5E7EB',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
  }
} as const;

interface HecsLogoProps {
  className?: string;
  alt?: string;
}

export const HecsLogo: React.FC<HecsLogoProps> = ({
  className = 'h-9 w-auto',
  alt = 'HECS — Huber Enviro Care Systems'
}) => {
  return (
    <img
      src={HECS_LOGO_URL}
      alt={alt}
      className={`object-contain transition-opacity duration-200 ${className}`}
      loading="eager"
      onError={(e) => {
        // Fallback styling if offline/blocked without altering DOM layout
        const target = e.currentTarget;
        target.onerror = null;
      }}
    />
  );
};

