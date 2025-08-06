'use client'

interface LoadingSkeletonProps {
  className?: string
}

export default function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex max-w-[80%] ${index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
            <LoadingSkeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-10 w-48 rounded-2xl" />
              <LoadingSkeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatroomSkeleton() {
  return (
    <div className="p-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-3 rounded-lg mb-1">
          <LoadingSkeleton className="h-5 w-32 mb-2" />
          <LoadingSkeleton className="h-4 w-48 mb-2" />
          <div className="flex items-center gap-2">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-3 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}
