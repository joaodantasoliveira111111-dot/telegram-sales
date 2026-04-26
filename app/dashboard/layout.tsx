import { Sidebar } from '@/components/sidebar'
import { PaymentNotifier } from '@/components/payment-notifier'
import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
      <PaymentNotifier />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#f4f4f5',
          },
        }}
      />
    </div>
  )
}
