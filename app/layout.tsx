import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyFlow — Your personal study workspace',
  description: 'Turn class notes into flashcards, quizzes, practice tests, and study guides with AI.',
  applicationName: 'StudyFlow',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#09090b' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark"><body>{children}</body></html>;
}
