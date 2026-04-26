'use client'

interface FunnelStep {
  label: string
  value: number
  color: string
  bg: string
}

interface ConversionFunnelProps {
  started: number
  initiated: number
  paid: number
}

export function ConversionFunnel({ started, initiated, paid }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: 'Iniciaram o bot', value: started, color: 'bg-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Clicaram em comprar', value: initiated, color: 'bg-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pagaram', value: paid, color: 'bg-green-500', bg: 'bg-green-500/10' },
  ]

  const max = Math.max(started, 1)

  function pct(a: number, b: number) {
    if (b === 0) return '—'
    return ((a / b) * 100).toFixed(1) + '%'
  }

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const width = Math.round((step.value / max) * 100)
        const prev = steps[i - 1]
        const conversion = prev ? pct(step.value, prev.value) : null

        return (
          <div key={step.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-zinc-300">{step.label}</span>
              <div className="flex items-center gap-3">
                {conversion && (
                  <span className="text-xs text-zinc-500">
                    conv. <span className="font-medium text-zinc-400">{conversion}</span>
                  </span>
                )}
                <span className="font-bold text-zinc-100">{step.value.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="h-8 w-full overflow-hidden rounded-lg bg-zinc-800">
              <div
                className={`h-full ${step.color} transition-all duration-700 flex items-center px-3`}
                style={{ width: `${Math.max(width, step.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        )
      })}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <div className="rounded-lg bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-xs text-zinc-500">Início → Pagamento</p>
          <p className="mt-1 text-xl font-bold text-green-400">{pct(paid, started)}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-xs text-zinc-500">Checkout → Pagamento</p>
          <p className="mt-1 text-xl font-bold text-purple-400">{pct(paid, initiated)}</p>
        </div>
      </div>
    </div>
  )
}
