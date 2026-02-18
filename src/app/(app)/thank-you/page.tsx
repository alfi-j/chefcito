'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, RotateCcw } from 'lucide-react';

interface ThankYouPageProps {
  searchParams: {
    transactionId?: string;
    status?: string;
    clientTransactionId?: string;
    amount?: string;
    currency?: string;
  };
}

export default function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const router = useRouter();
  const { transactionId, status, clientTransactionId, amount, currency } = searchParams;
  
  // Validate required parameters
  const isValid = !!(transactionId && status);
  
  // Process transaction data
  const transactionData = isValid ? {
    transactionId,
    status,
    clientTransactionId,
    amount: amount ? (parseFloat(amount) / 100).toFixed(2) : '0.00',
    currency: currency || 'USD'
  } : null;
  
  const isLoading = false;

  // Server-side validation and processing
  if (process.env.NODE_ENV === 'development') {
    console.log('Thank you page params:', {
      transactionId,
      status,
      clientTransactionId,
      amount,
      currency
    });
    
    if (!isValid) {
      console.log('Missing required params:', { transactionId, status });
    }
    
    // Track successful payment in analytics (optional)
    if (status === 'approved') {
      console.log('Payment successful:', { transactionId, amount, currency });
    }
  }

  const handleGoHome = () => {
    router.push('/restaurant');
  };

  const handleRetry = () => {
    router.push('/profile'); // Redirect to profile to retry subscription
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (!transactionData && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Transaction</h2>
            <p className="text-gray-600 mb-6">Missing transaction information. Please check the URL parameters.</p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/profile')} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = transactionData?.status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="animate-fade-in-up">
          <Card className="overflow-hidden shadow-xl">
            <div className={`h-2 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4">
                {isSuccess ? (
                  <div className="transform scale-100 transition-transform duration-300">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                  </div>
                ) : (
                  <div className="h-20 w-20 text-red-500 mx-auto flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              
              <CardTitle className="text-3xl font-bold">
                {isSuccess ? 'Thank You!' : 'Payment Failed'}
              </CardTitle>
              
              <CardDescription className="text-lg mt-2">
                {isSuccess 
                  ? 'Your subscription has been activated successfully' 
                  : 'Your payment could not be processed'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                      {transactionData?.status?.toUpperCase() || 'INVALID'}
                    </span>
                  </div>
                  
                  {isSuccess && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-gray-900">
                          ${transactionData?.amount || '0.00'} {transactionData?.currency || 'USD'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-sm text-gray-900">
                          {transactionData?.transactionId?.substring(0, 12) || 'N/A'}...
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="text-gray-900">
                          {transactionData?.clientTransactionId || 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {isSuccess && (
                <div className="animate-fade-in text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">🎉 Welcome to ChefCito Pro!</h4>
                    <p className="text-green-700">
                      Your subscription is now active. Enjoy all premium features including advanced reporting, 
                      priority support, and unlimited menu items.
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>A confirmation email has been sent to your registered email address.</p>
                    <p>Your subscription will automatically renew monthly.</p>
                  </div>
                </div>
              )}

              {/* Failure Message */}
              {!isSuccess && (
                <div className="animate-fade-in text-center space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Payment Declined</h4>
                    <p className="text-red-700">
                      Your payment was not approved. Please check your payment details and try again.
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>If you continue to experience issues, please contact support.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isSuccess ? (
                  <>
                    <Button 
                      onClick={handleGoHome} 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/reports')}
                      className="flex-1"
                    >
                      View Reports
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleRetry} 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGoHome}
                      className="flex-1"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Need help? Contact our support team at support@chefcito.com</p>
            <p className="mt-1">© {new Date().getFullYear()} ChefCito. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
