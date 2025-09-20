import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  maxStars?: number
  showValue?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Rating({ 
  value, 
  maxStars = 5, 
  showValue = false, 
  className,
  size = "md"
}: RatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  const renderStars = () => {
    const stars = []
    
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= Math.floor(value)
      const isPartial = i === Math.ceil(value) && value % 1 !== 0
      
      stars.push(
        <div key={i} className="relative">
          <Star
            className={cn(
              sizeClasses[size],
              "text-gray-300"
            )}
            fill="currentColor"
          />
          {(isFilled || isPartial) && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                width: isPartial ? `${(value % 1) * 100}%` : '100%'
              }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-yellow-400"
                )}
                fill="currentColor"
              />
            </div>
          )}
        </div>
      )
    }
    
    return stars
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showValue && (
        <span className={cn(
          "ml-2 font-medium text-gray-700",
          textSizeClasses[size]
        )}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
