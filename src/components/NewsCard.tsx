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
    <Card className="p-4 hover:shadow-[var(--shadow-medium)] transition-shadow">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight flex-1">{title}</h3>
            <Badge variant="default" className="text-xs whitespace-nowrap bg-green-500/20 text-green-600 border-green-500/30">
              {confidencePercent}%
            </Badge>
          </div>
          
          {snippet && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {snippet}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{sourceName} • {timeAgo}</span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              Ver <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};