'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = true,
}: GlassCardProps) {
  const variants = {
    default: 'glass-card',
    light: 'glass-light',
    dark: 'glass',
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl',
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10',
        className
      )}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
