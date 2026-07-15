import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Toaster } from '@/components/ui/sonner'
import AuthGuard from '@/components/AuthGuard'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
})

export const metadata: Metadata = {
  title: '수성마켓 - 수성인재육성랩 중고 상품 플랫폼',
  description:
    '동네 이웃과 함께하는 믿을 수 있는 중고거래 플랫폼, 수성마켓. 포인트로 안전하게 거래하세요.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#00a9e0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        <AuthGuard>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
          </div>
          <Toaster position="top-center" richColors />
        </AuthGuard>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
