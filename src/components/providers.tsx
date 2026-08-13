"use client"

import { useEffect } from 'react'
import { SWRConfig } from 'swr'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { swrConfig } from '@/lib/swr-fetcher'
import { patchFetchWithAuth } from '@/lib/client-fetch'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    patchFetchWithAuth()
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <SWRConfig value={swrConfig}>
        {children}
      </SWRConfig>
    </I18nextProvider>
  )
}