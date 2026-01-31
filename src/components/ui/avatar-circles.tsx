"use client"

import { cn } from "@/lib/utils"
import { X, Clock } from "lucide-react"
import type { AttendanceStatus } from "@/types/database"

interface Avatar {
  imageUrl: string
  profileUrl?: string
  job?: string
  attendanceStatus?: AttendanceStatus
  lateMinutes?: number
}

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: Avatar[]
  showJob?: boolean
  noOverlap?: boolean
}

export const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
  showJob = false,
  noOverlap = false,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex", noOverlap ? "gap-2" : "-space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((avatar, index) => {
        const hasImage = avatar.imageUrl && avatar.imageUrl !== '/default-avatar.png'
        const isCanceled = avatar.attendanceStatus === 'canceled'
        const isLate = avatar.attendanceStatus === 'late'

        const content = (
          <div className="relative group">
            {/* Avatar image or placeholder */}
            <div className={cn("relative", isCanceled && "opacity-50")}>
              {hasImage ? (
                <img
                  className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                  src={avatar.imageUrl}
                  width={40}
                  height={40}
                  alt={avatar.job || `Avatar ${index + 1}`}
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white text-sm font-medium">
                  {avatar.job ? avatar.job.charAt(0) : '?'}
                </div>
              )}

              {/* Canceled overlay badge */}
              {isCanceled && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <X className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Late overlay badge */}
              {isLate && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <Clock className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Job tooltip */}
            {showJob && avatar.job && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                {avatar.job}
                {isCanceled && ' (キャンセル)'}
                {isLate && avatar.lateMinutes && ` (${avatar.lateMinutes}分遅れ)`}
              </div>
            )}

            {/* Canceled/Late tooltip without showJob */}
            {!showJob && (isCanceled || isLate) && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                {isCanceled && 'キャンセル'}
                {isLate && avatar.lateMinutes && `${avatar.lateMinutes}分遅れ`}
              </div>
            )}
          </div>
        )

        if (avatar.profileUrl) {
          return (
            <a
              key={index}
              href={avatar.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          )
        }

        return <div key={index}>{content}</div>
      })}
      {(numPeople ?? 0) > 0 && (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white dark:border-gray-800 dark:bg-white dark:text-black"
        >
          +{numPeople}
        </div>
      )}
    </div>
  )
}
