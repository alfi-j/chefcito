'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function RestaurantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Restaurant page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center py-16 px-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-headline font-bold">
        Something went wrong loading this page
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        An unexpected error occurred. You can try again, or reload the page.
        {error.digest && <span className="block mt-1 text-xs">{error.digest}</span>}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  )
}