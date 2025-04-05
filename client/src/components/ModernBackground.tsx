import React from 'react';

interface ModernBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernBackground({ children, className = "" }: ModernBackgroundProps) {
  return (
    <div className={`min-h-screen bg-background relative ${className}`}>
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none"></div>
      
      {children}
    </div>
  );
} 