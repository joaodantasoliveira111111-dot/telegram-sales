import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LandingPage } from './_landing'

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get('tgsession')?.value
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  if (session === secret) redirect('/dashboard')
  return <LandingPage />
}
