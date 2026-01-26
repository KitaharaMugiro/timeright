'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ShimmerButtonProps {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ShimmerButton({
  shimmerColor = '#ffffff',
  shimmerSize = '0.1em',
  borderRadius = '100px',
  shimmerDuration = '2s',
  background = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  className,
  children,
  onClick,
  disabled = false,
  type = 'button',
}: ShimmerButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 font-medium text-white',
        'transform-gpu transition-transform duration-300 ease-in-out',
        '[background:var(--bg)] [border-radius:var(--radius)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={
        {
          '--bg': background,
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
          'before:opacity-0 group-hover:before:opacity-30'
        )}
      />

      {/* Glow effect */}
      <div
        className={cn(
          'absolute -z-10 blur-2xl transition-opacity duration-500',
          'opacity-0 group-hover:opacity-70',
          'inset-0 [background:var(--bg)]'
        )}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
