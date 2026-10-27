import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skolhub | School management, made simple',
  description: 'The complete school platform for Nigeria.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}