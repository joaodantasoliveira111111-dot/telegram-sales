import { DashboardShell } from '@/components/dashboard-shell'
import { PaymentNotifier } from '@/components/payment-notifier'
import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <PaymentNotifier />
      <Toaster
        theme="light"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.10)',
            color: '#1a1625',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          },
        }}
      />
    </>
  )
}
