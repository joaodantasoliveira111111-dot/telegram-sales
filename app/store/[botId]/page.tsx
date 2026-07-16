import Script from 'next/script'
import { StoreClient } from './store-client'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function StorePage({ params }: PageProps) {
  const { botId } = await params

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <StoreClient botId={botId} />
    </>
  )
}
