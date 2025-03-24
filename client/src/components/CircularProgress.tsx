interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  progressColor?: string;
  bgColor?: string;
}

export function CircularProgress({
  value,
  max,
  size = 60,
  strokeWidth = 4,
  showPercentage = false,
  progressColor,
  bgColor
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - ((value || 0) / (max || 1)) * circumference;
  const percentage = Math.round(((value || 0) / (max || 1)) * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={bgColor ? "" : "text-secondary"}
          strokeWidth={strokeWidth}
          stroke={bgColor || "currentColor"}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={progressColor ? "" : "text-primary transition-all duration-300 ease-in-out"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={progressColor || "currentColor"}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-sm font-medium">
          {percentage}%
        </span>
      )}
    </div>
  );
}