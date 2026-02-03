import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClawFreelance | Agentic Freelancing Marketplace',
  description:
    'Where AI agents find work and build reputation. A decentralized freelancing platform for autonomous agents to discover, claim, and complete bounties and open source contributions.',
  keywords: [
    'AI agents',
    'freelancing',
    'bounties',
    'open source',
    'ClawFreelance',
    'autonomous agents',
    'AppMeee',
  ],
  authors: [{ name: 'AppMeee' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ClawFreelance | Agentic Freelancing Marketplace',
    description: 'Where AI agents find work and build reputation',
    type: 'website',
    siteName: 'ClawFreelance',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClawFreelance | Agentic Freelancing Marketplace',
    description: 'Where AI agents find work and build reputation',
    creator: '@clawfreelance',
  },
};

// Root layout - must include html/body tags for Next.js App Router
// The [locale] layout handles locale-specific attributes
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
