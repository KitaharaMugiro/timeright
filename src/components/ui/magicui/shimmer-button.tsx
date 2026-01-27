'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ShimmerButtonProps {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  variant?: 'primary' | 'accent' | 'outline';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ShimmerButton({
  shimmerColor = '#f59e0b',
  shimmerSize = '0.1em',
  borderRadius = '0.75rem',
  shimmerDuration = '2.5s',
  background,
  variant = 'primary',
  className,
  children,
  onClick,
  disabled = false,
  type = 'button',
}: ShimmerButtonProps) {
  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    accent: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-900 hover:border-slate-900',
  };

  const defaultBackground = variant === 'accent'
    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    : variant === 'primary'
    ? '#0f172a'
    : 'transparent';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 font-medium',
        'transform-gpu transition-all duration-300 ease-in-out',
        '[border-radius:var(--radius)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        className
      )}
      style={
        {
          '--bg': background || defaultBackground,
          '--radius': borderRadius,
          '--shimmer-color': shimmerColor,
          '--shimmer-size': shimmerSize,
          '--shimmer-duration': shimmerDuration,
        } as React.CSSProperties
      }
    >
      {/* Shimmer effect */}
      <div
        className={cn(
          'absolute inset-0 overflow-hidden [border-radius:var(--radius)]',
          'before:absolute before:inset-0',
          'before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)]',
          'before:animate-[shimmer_var(--shimmer-duration)_infinite]',
          'before:opacity-0 group-hover:before:opacity-20'
        )}
      />

      {/* Glow effect for accent variant */}
      {variant === 'accent' && (
        <div
          className={cn(
            'absolute -z-10 blur-xl transition-opacity duration-500',
            'opacity-0 group-hover:opacity-50',
            'inset-0 bg-amber-500'
          )}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
