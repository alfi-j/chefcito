import { Skeleton } from '@/components/ui/skeleton'

export default function RestaurantLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-9 w-56" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-52" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>
    </div>
  )
}