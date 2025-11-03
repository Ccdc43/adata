import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A股实时监控',
  description: '基于 adata SDK 的 A 股实时监控平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
