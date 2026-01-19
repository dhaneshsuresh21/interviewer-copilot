import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interviewer Assistant',
  description: 'AI-powered interview assistant for interviewers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
