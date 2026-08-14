import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { PT_Sans, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { AuthWrapper } from '@/components/layout/auth-provider';
import { Providers } from '@/components/providers';

const ptSans = PT_Sans({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`${ptSans.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Payphone Cajita de Pagos */}
        <link href="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css" rel="stylesheet" />
        {/* Cargar script con atributos para mejor control de carga */}
        <Script
          src="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js"
          strategy="afterInteractive"
        />
        {/* Suppress analytics/DevTools noise React cannot render inline <script> in head */}
        <Script id="payphone-devtools-cleanup" strategy="afterInteractive">
          {`
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

              // Log para rastrear carga del script de Payphone
              console.log('[Layout] Script de Payphone insertado en el DOM');

              // Detectar cuando el script carga
              window.addEventListener('load', function() {
                console.log('[Layout] Window load event fired');
                setTimeout(function() {
                  console.log('[Layout] PPaymentButtonBox disponible:', typeof window.PPaymentButtonBox !== 'undefined');
                }, 500);
              });
            }
          `}
        </Script>
      </head>
      <body className="font-body antialiased">
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}