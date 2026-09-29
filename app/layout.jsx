import './globals.css';

export const metadata = {
  title: 'Gym Management',
  description: 'Gym member and operations management system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
