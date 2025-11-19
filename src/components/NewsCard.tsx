import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink } from "lucide-react";

interface NewsCardProps {
  title: string;
  snippet: string;
  sourceName: string;
  sourceUrl: string;
  confidenceScore: number;
  verifiedAt: string;
}

export const NewsCard = ({ 
  title, 
  snippet, 
  sourceName, 
  sourceUrl, 
  confidenceScore,
  verifiedAt 
}: NewsCardProps) => {
  const confidencePercent = Math.round(confidenceScore * 100);
  const timeAgo = new Date(verifiedAt).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Card className="p-4 sm:p-5 hover:shadow-[var(--shadow-large)] transition-all hover:scale-[1.01] sm:hover:scale-[1.02] duration-200 border-2 active:scale-[0.99]">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg flex-shrink-0">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
            <h3 className="font-semibold text-sm sm:text-base leading-snug flex-1">{title}</h3>
            <Badge variant="default" className="text-xs whitespace-nowrap bg-green-500/20 text-green-600 border-green-500/30 px-2 sm:px-3 py-0.5 sm:py-1 flex-shrink-0">
              {confidencePercent}%
            </Badge>
          </div>
          
          {snippet && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 sm:pt-3 border-t gap-2">
            <span className="font-medium truncate">{sourceName} • {timeAgo}</span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 text-primary hover:underline font-medium transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation min-h-[44px] -my-2 py-2"
            >
              <span className="hidden sm:inline">Ver notícia</span>
              <span className="sm:hidden">Ver</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};