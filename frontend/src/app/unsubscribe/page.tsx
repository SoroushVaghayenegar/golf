"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unsubscribe } from '@/services/supabaseService';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnsubscribing, setIsUnsubscribing] = useState<boolean>(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    // If either token or email is missing, redirect to 404
    if (!emailParam || !tokenParam) {
      redirect('/not-found');
      return;
    }
    
    setEmail(emailParam);
    setToken(tokenParam);
    setIsLoading(false);
  }, [searchParams]);

  const handleUnsubscribe = async () => {
    setIsUnsubscribing(true);
    setError('');
    
    try {
      await unsubscribe(email, token);
      setIsUnsubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while unsubscribing');
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Show loading state while checking parameters
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {!isUnsubscribed ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Unsubscribe</h1>
              <p className="text-gray-600">
                We&apos;re sorry to see you go. You can unsubscribe from our weekly tee times below.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled={true}
                  className="w-full"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="pt-4">
                <p className="text-center text-gray-700 mb-4 font-medium">
                  Want to unsubscribe from weekly tee times?
                </p>
                <Button
                  onClick={handleUnsubscribe}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  disabled={isUnsubscribing}
                >
                  {isUnsubscribing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Unsubscribing...
                    </div>
                  ) : (
                    'Unsubscribe'
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  Changed your mind?{' '}
                  <Link href="/" className="text-blue-600 hover:text-blue-500 underline">
                    Return to T-Times Golf
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Successfully Unsubscribed</h1>
              <p className="text-gray-600">
                You have been successfully unsubscribed from weekly tee times. You will no longer receive our emails.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  <strong>{email}</strong> has been removed from our mailing list.
                </p>
              </div>
              
              <div className="pt-4">
                <Link 
                  href="/" 
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Return to T-Times Golf
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
