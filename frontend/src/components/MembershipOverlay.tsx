"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2, Sparkles, Bell, Zap, Shield, Smartphone } from "lucide-react";
import { checkMembershipRequest, createMembershipRequest } from "@/services/membershipRequestService";
import { toast } from "sonner";

type OverlayState = "loading" | "not_requested" | "already_requested" | "just_submitted";

export default function MembershipOverlay() {
  const [state, setState] = useState<OverlayState>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { hasRequested } = await checkMembershipRequest();
        setState(hasRequested ? "already_requested" : "not_requested");
      } catch {
        // If error, assume not requested so they can try
        setState("not_requested");
      }
    };
    checkStatus();
  }, []);

  const handleRequestMembership = async () => {
    setSubmitting(true);
    try {
      await createMembershipRequest();
      setState("just_submitted");
      toast.success("Interest registered!", {
        description: "We'll notify you when membership becomes available.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register interest";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 p-8 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-500/20 blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-amber-300">
              <Crown className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-wide">Premium Feature</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Watchlist is Going Premium
          </h2>

          {/* Description */}
          <p className="mb-6 text-center text-emerald-100/90">
            The Tee Time Watchlist is becoming a members-only feature. Get notified about 
            cancellations and new openings before anyone else.
          </p>

          {/* Features list */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3 text-emerald-100/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <Bell className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm">Instant alerts for last-minute cancellations</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <Smartphone className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm">SMS/text message notifications</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm">Priority access to all future features</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm">Support the platform&apos;s continued development</span>
            </div>
          </div>

          {/* CTA Section */}
          {state === "loading" ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          ) : state === "not_requested" ? (
            <div className="space-y-4">
              <Button
                onClick={handleRequestMembership}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl disabled:opacity-70"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {submitting ? "Registering..." : "I'm Interested in Membership"}
              </Button>
              <p className="text-center text-xs text-emerald-200/60">
                Membership is not available yet. By clicking above, you&apos;ll be notified when it launches.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-500/20 px-6 py-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/30">
                  <Check className="h-6 w-6 text-emerald-300" />
                </div>
                <p className="text-center font-medium text-emerald-100">
                  {state === "just_submitted" 
                    ? "Thanks for your interest!" 
                    : "You're already on the list!"}
                </p>
                <p className="mt-1 text-center text-sm text-emerald-200/70">
                  We&apos;ll notify you as soon as membership becomes available.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

