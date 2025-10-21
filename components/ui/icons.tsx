'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('h-4 w-4 relative', className)}
      {...props}
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
