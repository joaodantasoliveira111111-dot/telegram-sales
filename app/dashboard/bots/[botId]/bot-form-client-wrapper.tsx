'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bot } from '@/types'
import { BotForm } from '../bot-form'

export function BotFormClientWrapper({ bot }: { bot: Bot }) {
  const router = useRouter()
  const [currentBot, setCurrentBot] = useState(bot)

  function handleSaved(updated: Bot) {
    setCurrentBot(updated)
    toast.success('Bot atualizado com sucesso!')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-100">Configurações do Bot</h2>
        <p className="text-sm text-slate-500">Edite o nome, token e mensagem de boas-vindas</p>
      </div>
      <BotForm
        bot={currentBot}
        onSaved={handleSaved}
        onCancel={() => router.push('/dashboard/bots')}
      />
    </div>
  )
}
