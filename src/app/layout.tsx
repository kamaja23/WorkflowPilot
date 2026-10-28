import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import MockBanner from '@/components/MockBanner'

export const metadata: Metadata = {
  title: 'WorkflowPilot',
  description: 'AI workflow automation & reliability platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MockBanner />
        <header className="border-b p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">WorkflowPilot</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/">Dashboard</Link>
              <Link href="/evaluations">Reliability</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
