import Link from 'next/link';
import { BellIcon, HeartIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

interface MarketingTeeCardProps {
  index: number;
}

export default function MarketingTeeCard({ index }: MarketingTeeCardProps) {

  return (
    <div
      key={index}
      className="bg-gradient-to-br from-indigo-200 to-amber-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border-2 border-blue-200 overflow-hidden w-full max-w-full relative"
    >
      {/* Attention-grabbing badge */}
      <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
        NEW
      </div>
      
      <div className="p-5 w-full max-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BellIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900 flex-1 min-w-0">
              Don&apos;t miss your perfect tee time!
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Can&apos;t find the right tee time for your group size? Create a watchlist to get instant alerts for cancellations and newly released tee times.
          </p>
        </div>

        {/* Features Section */}
        <div className="bg-white/60 rounded-lg p-3 mb-4">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Get notified of last-minute cancellations</span>
            </div>
            <div className="flex items-center gap-2">
              <MagnifyingGlassIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Alert for future tee times not yet announced</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>Customize by course, date, and group size</span>
            </div>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-200 w-full max-w-full">
          <Link
            href="/tee-time-watchlist/create"
            className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 text-center block transform hover:scale-[1.02] active:scale-[0.98] max-w-full overflow-hidden bg-green-700 focus:bg-green-800 text-white shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Create Watchlist</span>
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
