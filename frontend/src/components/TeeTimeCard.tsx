import { parseDateTimeInVancouver } from "../services/timezoneService";
import { TeeTime } from "../services/teeTimeService";
import { StarIcon } from "@heroicons/react/24/outline";

// Rating component
const Rating = ({ rating }: { rating: number | null }) => {
  if (rating === null) return null;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarIcon className="w-4 h-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="text-sm text-slate-600 ml-1">({rating.toFixed(1)})</span>
    </div>
  );
};

interface TeeTimeCardProps {
  teeTime: TeeTime;
  index: number;
}

export default function TeeTimeCard({ teeTime, index }: TeeTimeCardProps) {
  return (
    <div
      key={index}
      className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{teeTime.course_name}</h3>
          <p className="text-sm text-slate-500">{teeTime.city}</p>
          <Rating rating={teeTime.rating} />
        </div>
        <div className="flex flex-col gap-1 text-slate-600">
          <p className="text-lg font-medium">
            {parseDateTimeInVancouver(teeTime.start_datetime).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Vancouver'
            })}
          </p>
          <p>{teeTime.holes} holes</p>
          <p>{teeTime.players_available} spots available</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            ${Number(teeTime.price).toFixed(2)}
          </p>
        </div>
        {teeTime.booking_link && (
          <div className="mt-2">
            <a
              href={teeTime.booking_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full px-4 py-2 font-semibold rounded-lg transition-colors text-center block ${
                teeTime.booking_link.includes('cps')
                  ? 'bg-black hover:bg-gray-800 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {teeTime.booking_link.includes('cps') ? 'Take me to website' : 'Book'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
