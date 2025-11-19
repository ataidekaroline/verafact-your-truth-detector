import { useEffect, useState } from "react";
import logo from "@/assets/verafact-logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loading screen after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onLoadingComplete after fade-out animation completes
      setTimeout(onLoadingComplete, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background ${
        isVisible ? "animate-fade-in" : "animate-fade-out"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <img 
          src={logo} 
          alt="VeraFact" 
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-[var(--shadow-large)] animate-scale-in"
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground animate-fade-in">
            VeraFact
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground animate-fade-in">
            Truth Finder
          </p>
        </div>
        <div className="w-16 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary animate-slide-in-right" />
        </div>
      </div>
    </div>
  );
};
