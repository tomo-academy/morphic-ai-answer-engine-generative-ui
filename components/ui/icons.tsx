'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'

interface IconLogoProps {
  className?: string
}

function IconLogo({ className }: IconLogoProps) {
  return (
    <div
      className={cn('h-4 w-4 relative', className)}
    >
      <Image
        src="/images/tomo-the-hub.png"
        alt="TOMO AI BUDDY Logo"
        fill
        className="object-contain"
      />
    </div>
  )
}

export { IconLogo }
