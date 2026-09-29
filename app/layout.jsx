import './globals.css';

export const metadata = {
  title: 'Oxygen Gym | Gym operations',
  description: 'A clear view of Oxygen Gym, its members, and daily operations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}