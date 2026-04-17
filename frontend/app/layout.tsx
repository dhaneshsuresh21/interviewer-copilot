import type { Metadata } from 'next'
import './globals.css'
import LoggerInit from '../components/LoggerInit'

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
      <body>
        <LoggerInit />
        {children}
      </body>
    </html>
  )
}
