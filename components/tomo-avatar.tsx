'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TomoAvatarProps {
  className?: string
  alt?: string
}

export function TomoAvatar({ 
  className,
  alt = 'TOMO AI BUDDY' 
}: TomoAvatarProps) {
  return (
    <Avatar className={cn('size-6', className)}>
      <AvatarImage 
        src="/images/tomo-the-hub.png" 
        alt={alt}
        className="object-cover"
      />
      <AvatarFallback>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
          AI
        </div>
      </AvatarFallback>
    </Avatar>
  )
}

export default TomoAvatar