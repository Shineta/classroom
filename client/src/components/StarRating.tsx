import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ value, onChange, max = 5, size = "md" }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (rating: number) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div className="flex space-x-1">
      {Array.from({ length: max }, (_, index) => {
        const rating = index + 1;
        const isActive = rating <= (hoverValue || value);
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            className={`transition-colors ${sizeClasses[size]} ${
              isActive ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded`}
          >
            <Star className={`${sizeClasses[size]} ${isActive ? "fill-current" : ""}`} />
          </button>
        );
      })}
    </div>
  );
}
