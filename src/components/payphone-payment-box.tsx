"use client";

import React, { useEffect, useRef } from 'react';

export function PayPhonePaymentBox({
  totalAmount = 9.99,
  onPaymentComplete,
  onCancel,
}: {
  totalAmount?: number;
  onPaymentComplete?: (phoneNumber: string, transactionId: string) => void;
  onCancel?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Convert amount to cents (PayPhone requires amounts in cents)
  const amountInCents = Math.round(totalAmount! * 100);

  useEffect(() => {
    // Load PayPhone SDK scripts
    if (!scriptLoaded.current && containerRef.current) {
      scriptLoaded.current = true;

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js';
      script.onload = () => {
        // Initialize PayPhone payment box after scripts load
        const ppb = new (window as any).PPaymentButtonBox({
          token: process.env.NEXT_PUBLIC_TOKEN || '',
          clientTransactionId: `subscription_${Date.now()}`,
          amount: amountInCents,
          amountWithoutTax: amountInCents,
          tax: 0,
          currency: "USD",
          storeId: process.env.NEXT_PUBLIC_STORE_ID || '',
          reference: "ChefCito Pro Subscription",
          backgroundColor: "#FF6B00"
        });

        // Render the payment box
        ppb.render('pp-button');

        // Add event listener for payment completion
        const handlePaymentSuccess = (event: any) => {
          if (event.detail) {
            // Redirect to thank you page with transaction details
            const params = new URLSearchParams({
              transactionId: event.detail.transactionId || '',
              status: event.detail.status || '',
              clientTransactionId: event.detail.clientTransactionId || '',
              amount: event.detail.amount ? (event.detail.amount * 100).toString() : '',
              currency: event.detail.currency || 'USD'
            });
            
            window.location.href = `/thank-you?${params.toString()}`;
          }
        };

        document.addEventListener('ppb-payment-success', handlePaymentSuccess);
        
        return () => {
          document.removeEventListener('ppb-payment-success', handlePaymentSuccess);
        };
      };
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup if needed
      if (containerRef.current) {
        const container = containerRef.current;
        container.innerHTML = '';
      }
    };
  }, [totalAmount, onPaymentComplete]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        ref={containerRef} 
        id="pp-button" 
        className="border-orange-500 rounded-lg overflow-hidden"
      >
        {/* PayPhone will inject the payment box here */}
        <div className="p-4 bg-white text-center">
          <div className="text-sm font-medium mb-2">Cargando Cajita de Pagos Payphone...</div>
          <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}