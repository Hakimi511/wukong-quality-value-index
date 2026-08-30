import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '悟空质量价值指数',
  description: '悟空质量价值指数的收盘观察、历史路径与因子研究摘要。',
  openGraph: {
    title: '悟空质量价值指数',
    description: '质量、价值与价格纪律的长期研究。',
    images: [{ url: '/social-preview.png', width: 1729, height: 910 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
