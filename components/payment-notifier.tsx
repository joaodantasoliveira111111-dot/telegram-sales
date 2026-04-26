'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // ignore if audio not available
  }
}

export function PaymentNotifier() {
  const lastIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/payments?status=paid&page=1')
        const json = await res.json()
        const payments = json.data ?? []

        if (payments.length === 0) return

        const latestId = payments[0].id

        if (!initializedRef.current) {
          // First load — just store the latest ID, don't notify
          lastIdRef.current = latestId
          initializedRef.current = true
          return
        }

        if (lastIdRef.current !== latestId) {
          const newPayments = []
          for (const p of payments) {
            if (p.id === lastIdRef.current) break
            newPayments.push(p)
          }

          for (const p of newPayments) {
            const value = (p.plan as { price: number } | null)?.price ?? 0
            playPing()
            toast.success(`💰 Novo pagamento recebido!`, {
              description: `${p.plan?.name ?? 'Plano'} — ${formatCurrency(value)}`,
              duration: 6000,
            })
          }

          lastIdRef.current = latestId
        }
      } catch {
        // silent fail
      }
    }

    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  return null
}
