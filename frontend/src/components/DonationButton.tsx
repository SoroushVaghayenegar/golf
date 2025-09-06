"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

interface DonationButtonProps {
  className?: string;
}

export default function DonationButton({ className = "" }: DonationButtonProps) {
  const Icon = Gift;

  // Full version with text
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div className="text-sm text-slate-600 font-small">
        Like the app? Help keep TeeClub free and fast.
      </div>
      <Link
        href="https://www.buymeacoffee.com/teeclub"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full sm:inline-flex sm:w-auto items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg font-semibold text-slate-900 bg-yellow-300 hover:bg-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md group"
      >
        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Buy us a golf ball!</span>
      </Link>
    </div>
  );
}


