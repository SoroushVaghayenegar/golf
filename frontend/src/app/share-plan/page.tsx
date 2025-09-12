"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSharedTeeTimes, type ShareTeeTime, type GetShareResponse } from '@/services/shareTeeTimesService';
import { type TeeTime } from '@/services/teeTimeService';
import TeeTimeShareCard from '@/components/TeeTimeShareCard';
import TeeTimeCardSkeleton from '@/components/TeeTimeCardSkeleton';

export default function SharePlanPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<GetShareResponse | null>(null);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [clientId, setClientId] = useState<string>('');

  // Detect if user is on mobile device
  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  // Get or generate client ID on component mount
  useEffect(() => {
    const getOrGenerateClientId = () => {
      // First check if client_id exists in localStorage
      const existingClientId = localStorage.getItem('client_id');
      
      if (existingClientId) {
        return existingClientId;
      }
      
      // Generate new client_id if it doesn't exist
      let newClientId: string;
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        newClientId = crypto.randomUUID();
      } else {
        // Fallback for environments that don't support crypto.randomUUID()
        newClientId = 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
      }
      
      // Store the new client_id in localStorage for future use
      localStorage.setItem('client_id', newClientId);
      return newClientId;
    };
    
    setClientId(getOrGenerateClientId());
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    // If token is missing, show error
    if (!tokenParam) {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    // Fetch shared tee times using the token
    const fetchSharedData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getSharedTeeTimes(tokenParam);
        setShareData(response);
        
        // Extract tee times from the share tee times objects
        const extractedTeeTimes = response.tee_times.map((shareTeeTime: ShareTeeTime) => shareTeeTime.tee_time_object);
        setTeeTimes(extractedTeeTimes);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching shared tee times:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shared tee times');
        setIsLoading(false);
      }
    };
    
    fetchSharedData();
  }, [searchParams]);

  // Handle vote updates from TeeTimeShareCard
  const handleVoteUpdate = (shareTeeTimeId: number, approvals: number, disapprovals: number, userVote: 'approve' | 'disapprove' | null, approvalsArray?: string[], disapprovalsArray?: string[]) => {
    // Update the shareData with new vote counts
    setShareData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        tee_times: prevData.tee_times.map(shareTime => {
          if (shareTime.id === shareTeeTimeId) {
            return {
              ...shareTime,
              approvals: approvalsArray || shareTime.approvals, // Use actual arrays from API response
              disapprovals: disapprovalsArray || shareTime.disapprovals // Use actual arrays from API response
            };
          }
          return shareTime;
        })
      };
    });
  };

  // Legacy handle vote function (kept for compatibility but not used with new voting system)
  const handleVote = async (teeTimeId: string, vote: 'approve' | 'disapprove') => {
    console.log(`Legacy vote handler: ${vote} for tee time ${teeTimeId}`);
    // This shouldn't be called with the new implementation
  };

  // Handle share functionality - native share on mobile, clipboard + toast on web
  const handleNativeShare = async () => {
    const url = window.location.href;
    const shareText = `Check out these Tee Times I'm sharing with you! ${teeTimes.length} great tee time${teeTimes.length !== 1 ? 's' : ''} available.`;
    
    try {
      // Use native share on mobile devices
      if (isMobile && typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({
          url,
          title: "Shared Tee Times",
          text: shareText,
        });
        return;
      }

      // Web (or fallback): copy to clipboard and show toast
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast.success(
          <>
            Link copied to clipboard
            <br />
            You can now share it with your friends to vote!
          </>
        );
      } else {
        // Legacy fallback for older browsers
        const temp = document.createElement("input");
        temp.value = `${shareText}\n${url}`;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        toast.success(
          <>
            Link copied to clipboard
            <br />
            You can now share it with your friends to vote!
          </>
        );
      }
    } catch (error) {
      // Don't show error toast if user cancelled the share
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      toast.error("Failed to share. Please try again.");
    }
  };

  // Show loading state while checking parameters
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-slate-100 p-4 pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 text-center">
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <TeeTimeCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if token is missing or if there's an API error
  if (hasError || error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error Finding Share Plan
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The share plan link appears to be invalid or expired.'}
          </p>
          <Link href="/">
            <Button className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show tee time cards when data is loaded
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-slate-100 p-4 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Shared Tee Times
          </h1>
          <p className="text-gray-600 mb-4">
            {teeTimes.length} tee time{teeTimes.length !== 1 ? 's' : ''} shared with you
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/">
              <Button variant="outline">
                Find More Tee Times
              </Button>
            </Link>
            <Button 
              onClick={handleNativeShare}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Share2 className="w-4 h-4" />
              Share with friends to vote!
            </Button>
          </div>
        </div>
        
        {teeTimes.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {shareData?.tee_times.map((shareTeeTime, index) => {
              const teeTime = shareTeeTime.tee_time_object;
              return (
                <TeeTimeShareCard
                  key={`${teeTime.id}-${index}`}
                  teeTime={teeTime}
                  index={index}
                  onVote={handleVote}
                  approvals={shareTeeTime.approvals || []}
                  disapprovals={shareTeeTime.disapprovals || []}
                  shareTeeTimeId={shareTeeTime.id}
                  clientId={clientId}
                  onVoteUpdate={handleVoteUpdate}
                  available={shareTeeTime.available}
                />
              );
            })}
          </div>
        )}
        
        {teeTimes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No tee times found in this share plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
