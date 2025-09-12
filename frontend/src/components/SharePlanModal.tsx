"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { getSharedTeeTimes, type ShareTeeTime, type GetShareResponse } from '@/services/shareTeeTimesService';
import { type TeeTime } from '@/services/teeTimeService';
import TeeTimeShareCard from '@/components/TeeTimeShareCard';
import TeeTimeCardSkeleton from '@/components/TeeTimeCardSkeleton';

interface SharePlanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string | null;
}

export default function SharePlanModal({ isOpen, onOpenChange, shareToken }: SharePlanModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Fetch share data when modal opens and token is available
  useEffect(() => {
    if (!isOpen || !shareToken) {
      return;
    }
    
    // Fetch shared tee times using the token
    const fetchSharedData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getSharedTeeTimes(shareToken);
        setShareData(response);
        
        // Extract tee times from the share tee times objects
        const extractedTeeTimes = response.tee_times.map((shareTeeTime: ShareTeeTime) => shareTeeTime.tee_time_object);
        setTeeTimes(extractedTeeTimes);
        
      } catch (err) {
        console.error('Error fetching shared tee times:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shared tee times');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedData();
  }, [isOpen, shareToken]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareData(null);
      setTeeTimes([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

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
    if (!shareToken) return;
    
    const url = `${window.location.origin}/share-plan?token=${shareToken}`;
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
        await navigator.clipboard.writeText(`${url}`);
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
        temp.value = `${url}`;
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

  // Open in new tab functionality
  const handleOpenInNewTab = () => {
    if (!shareToken) return;
    window.open(`/share-plan?token=${shareToken}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-2xl xl:max-w-4xl w-full max-h-[90vh] p-0 gap-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Shared Tee Times
              </DialogTitle>
            </DialogHeader>
            
            {!isLoading && !error && teeTimes.length > 0 && (
              <>
                <p className="text-gray-600 mt-2">
                  {teeTimes.length} tee time{teeTimes.length !== 1 ? 's' : ''} shared with you
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    onClick={handleNativeShare}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with friends
                  </Button>
                  <Button 
                    onClick={handleOpenInNewTab}
                    size="sm"
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in new tab
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <TeeTimeCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Share Plan
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error}
                  </p>
                  <Button 
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              )}

              {/* Tee times content */}
              {!isLoading && !error && teeTimes.length > 0 && (
                <div className="space-y-4">
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

              {/* Empty state */}
              {!isLoading && !error && teeTimes.length === 0 && shareData && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No tee times found in this share plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
