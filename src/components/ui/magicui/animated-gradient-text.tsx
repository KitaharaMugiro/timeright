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
        'inline-block animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_auto] bg-clip-text text-transparent leading-normal pb-2',
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
