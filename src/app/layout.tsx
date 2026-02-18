import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Chefcito',
  description: 'POS and KDS for modern restaurants',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Chrome DevTools profiling warnings
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (
                    message.includes('Base.Message.Init: Init completed slowly') ||
                    message.includes('Base.Events: Time boxed event exceeded timeout') ||
                    message.includes('Base.DF: Device profiling did not complete')
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}