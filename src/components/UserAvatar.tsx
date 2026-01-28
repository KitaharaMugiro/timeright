'use client';

import { cn } from '@/lib/utils';
import type { Gender } from '@/types/database';

interface UserAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  gender: Gender;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function UserAvatar({
  displayName,
  avatarUrl,
  gender,
  size = 'md',
  className,
}: UserAvatarProps) {
  const initial = displayName.charAt(0);

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        sizeClasses[size],
        gender === 'male'
          ? 'bg-gender-male-bg text-gender-male'
          : 'bg-gender-female-bg text-gender-female',
        className
      )}
    >
      {initial}
    </div>
  );
}
