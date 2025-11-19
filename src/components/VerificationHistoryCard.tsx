import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { formatDistanceToNow } from "date-fns";

interface VerificationHistoryCardProps {
  inputText: string;
  mlResult: boolean;
  confidenceScore: number;
  verifiedAt: string;
  referenceSites?: string[] | null;
}

export const VerificationHistoryCard = ({
  inputText,
  mlResult,
  confidenceScore,
  verifiedAt,
  referenceSites,
}: VerificationHistoryCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(verifiedAt), { addSuffix: true });

  return (
    <Card className="p-5 hover:shadow-[var(--shadow-medium)] transition-shadow border-2">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          mlResult 
            ? "bg-success/20" 
            : "bg-destructive/20"
        }`}>
          {mlResult ? (
            <CheckCircle className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-destructive" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-base line-clamp-2">
              {inputText}
            </h3>
            <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              mlResult 
                ? "bg-success/20 text-success" 
                : "bg-destructive/20 text-destructive"
            }`}>
              {mlResult ? "True" : "False"}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span>Confidence: {(confidenceScore * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>

          {referenceSites && referenceSites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {referenceSites.slice(0, 2).map((site, index) => {
                try {
                  const url = new URL(site);
                  return (
                    <a
                      key={index}
                      href={site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {url.hostname.replace("www.", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  );
                } catch {
                  return null;
                }
              })}
              {referenceSites.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{referenceSites.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
