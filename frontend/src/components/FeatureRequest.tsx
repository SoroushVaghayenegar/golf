"use client";
import { useState } from "react";
import posthog from 'posthog-js';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BadgeQuestionMark, Bug } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendFeatureRequest, FeatureRequest as FeatureRequestType } from "@/services/featureRequestService";

export default function FeatureRequest() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<string>("");
  const [requestText, setRequestText] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [bugText, setBugText] = useState("");
  const [bugEmail, setBugEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!requestType || !requestText.trim() || !requestEmail.trim()) return;
    
    if (!validateEmail(requestEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    posthog.capture('feature_request_submitted', { request_type: requestType });
    setIsSubmitting(true);
    setError("");
    
    try {
      const featureRequest: FeatureRequestType = {
        type: requestType,
        request: requestText.trim(),
        email: requestEmail.trim()
      };
      
      await sendFeatureRequest(featureRequest);
      
      // Reset form and close modal on success
      setIsModalOpen(false);
      setRequestType("");
      setRequestText("");
      setRequestEmail("");
    } catch (err) {
      setError("Failed to submit request. Please try again.");
      console.error("Error submitting feature request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBugSubmit = async () => {
    if (!bugText.trim() || !bugEmail.trim()) return;
    
    if (!validateEmail(bugEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    posthog.capture('bug_report_submitted');
    setIsSubmitting(true);
    setError("");
    
    try {
      const bugReport: FeatureRequestType = {
        type: "bug",
        request: bugText.trim(),
        email: bugEmail.trim()
      };
      
      await sendFeatureRequest(bugReport);
      
      // Reset form and close modal on success
      setIsBugModalOpen(false);
      setBugText("");
      setBugEmail("");
    } catch (err) {
      setError("Failed to submit bug report. Please try again.");
      console.error("Error submitting bug report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating circle button with dropdown menu */}
      <div className="fixed bottom-20 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <BadgeQuestionMark className="size-7"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
              Request new features or adding your city/courses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsBugModalOpen(true)}>
              <Bug className="w-4 h-4 mr-2" />
              Report Bug
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setError("");
          setRequestType("");
          setRequestText("");
          setRequestEmail("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request New Feature or City/Course</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Request Type
              </label>
              <Select value={requestType} onValueChange={(value) => {
                setRequestType(value);
                if (error) setError("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="city-course">City/Course Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <Textarea
                value={requestText}
                onChange={(e) => {
                  setRequestText(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Please describe your request in detail..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Email
              </label>
              <Input
                type="email"
                value={requestEmail}
                onChange={(e) => {
                  setRequestEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!requestType || !requestText.trim() || !requestEmail.trim() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bug Report Modal */}
      <Dialog open={isBugModalOpen} onOpenChange={(open) => {
        setIsBugModalOpen(open);
        if (!open) {
          setError("");
          setBugText("");
          setBugEmail("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Bug</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Bug Description
              </label>
              <Textarea
                value={bugText}
                onChange={(e) => {
                  setBugText(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Please describe the bug you encountered in detail..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Email
              </label>
              <Input
                type="email"
                value={bugEmail}
                onChange={(e) => {
                  setBugEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsBugModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBugSubmit}
                disabled={!bugText.trim() || !bugEmail.trim() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
      