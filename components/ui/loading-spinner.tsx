"use client"

// Loading component with animated dots and optional progress bar
export function AnimatedDotsLoader() {
  return (
    <div className="flex items-center justify-center gap-1">
      {/* Animated dots loader */}
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
  )
}

// Loading bar with progress percentage
export function ProgressBarLoader({ progress = 60 }: { progress?: number }) {
  return (
    <div className="w-full max-w-xs">
      {/* Progress bar container */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
      {/* Progress percentage text */}
      <p className="text-xs text-muted-foreground mt-2 text-center">{progress}% loading...</p>
    </div>
  )
}

// Combined loader with both animated dots and progress
export function LoaderWithProgress({ progress = 60 }: { progress?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <AnimatedDotsLoader />
      <ProgressBarLoader progress={progress} />
    </div>
  )
}

// LoadingSpinner component that's being imported elsewhere
interface LoadingSpinnerProps {
  text?: string
  size?: "small" | "medium" | "large"
}

export function LoadingSpinner({ text = "Loading...", size = "medium" }: LoadingSpinnerProps) {
  // Size classes for the spinner
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Animated spinner circle */}
      <div
        className={`${sizeClasses[size]} border-2 border-primary/30 border-t-primary rounded-full animate-spin`}
      ></div>
      {/* Optional loading text */}
      {text && size !== "small" && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
