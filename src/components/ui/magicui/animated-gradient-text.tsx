'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={cn(
        'inline-flex animate-gradient bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FF6B6B] bg-[length:200%_auto] bg-clip-text text-transparent',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.span>
  );
}
