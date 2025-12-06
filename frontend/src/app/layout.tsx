import type { Metadata } from 'next';
// @ts-expect-error: allow importing CSS as a side-effect without a type declaration
import './globals.css';

export const metadata: Metadata = {
  title: 'LLMUSE - AI Chat Interface',
  description: 'LLM-powered chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}