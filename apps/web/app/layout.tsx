import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ModernA11y - Ontario AODA Scanner',
  description: 'Scan websites for Ontario AODA compliance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
