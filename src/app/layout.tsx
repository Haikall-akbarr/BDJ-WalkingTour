
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'BDJ WalkingTour | Jelajahi Banjarmasin',
  description: 'Rasakan keindahan lokal Banjarmasin melalui tur jalan kaki yang dikurasi.',
  icons: {
    icon: '/favicon.svg',
  },
  verification: {
    google: '4T5iiF_vfUIkLDBqSyib8BwHcTK4jGDZB3Ge41lL7ys',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
