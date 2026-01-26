'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <motion.span
      className={cn(
        'relative inline-flex overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ width: shimmerWidth }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </motion.span>
  );
}
