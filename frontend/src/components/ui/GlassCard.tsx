import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isInteractive?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  isInteractive = false,
  onClick,
}) => {
  // Base classes for the glassmorphism look
  const baseClasses =
    "relative overflow-hidden rounded-3xl border border-surface-border bg-surface backdrop-blur-md shadow-glass";

  // Extra classes if the card needs to act like a button
  const interactiveClasses = isInteractive
    ? "transition-all duration-300 hover:-translate-y-1 hover:bg-surface-hover hover:border-brand-secondary/50 hover:shadow-glass-hover cursor-pointer"
    : "";

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={isInteractive ? "button" : "region"}
    >
      {children}
    </div>
  );
};

export default GlassCard;
