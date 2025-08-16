"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Share as ShareIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  buttonLabel?: string;
  className?: string;
}

export default function ShareButton({
  url,
  title,
  text,
  buttonLabel,
  className,
}: ShareButtonProps) {
  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (isMobile && typeof navigator !== "undefined" && "share" in navigator) {
        // Use native share on supported mobile browsers
        await navigator.share({
          url,
          title: title || "TeeClub",
          text,
        });
        return;
      }

      // Web (or fallback): copy to clipboard and toast
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else {
        // Legacy fallback
        const temp = document.createElement("input");
        temp.value = url;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      // Don't show error toast if user cancelled the share
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      toast.error("Failed to share. Please try again.");
    }
  }, [isMobile, text, title, url]);

  return (
    <Button
      onClick={handleShare}
      className={`bg-purple-600 hover:bg-purple-700 text-white ${className || ""}`}
    >
      <ShareIcon className="w-4 h-4" />
      {buttonLabel}
    </Button>
  );
}


