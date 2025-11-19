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
    <Card className="p-5 hover:shadow-[var(--shadow-large)] transition-all hover:scale-[1.02] duration-200 border-2">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <h3 className="font-semibold text-base leading-snug flex-1">{title}</h3>
            <Badge variant="default" className="text-xs whitespace-nowrap bg-green-500/20 text-green-600 border-green-500/30 px-3 py-1">
              {confidencePercent}%
            </Badge>
          </div>
          
          {snippet && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            <span className="font-medium">{sourceName} • {timeAgo}</span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline font-medium transition-colors"
            >
              Ver notícia <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};