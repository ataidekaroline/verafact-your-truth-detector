import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationResultProps {
  result: {
    is_true: boolean;
    confidence: number;
    reasoning: string;
    fact_summary: string;
    references: string[];
  };
}

export const VerificationResult = ({ result }: VerificationResultProps) => {
  const isTrue = result.is_true;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="space-y-6">
      {/* Result Header */}
      <Card className={`border-2 shadow-[var(--shadow-large)] ${isTrue ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isTrue ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {isTrue ? (
                <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">
                {isTrue ? '✓ Fact Verified as True' : '✗ ALERT: Detected as Fake News'}
              </CardTitle>
              <Badge variant={isTrue ? "default" : "destructive"} className="text-sm px-4 py-1.5">
                Confidence: {confidencePercent}%
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reasoning */}
      {result.reasoning && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              {isTrue ? 'Verification Analysis' : 'Why It\'s False'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground leading-relaxed">{result.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Fact Summary */}
      {result.fact_summary && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              {isTrue ? 'Verified Summary' : 'The True Fact'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground leading-relaxed">{result.fact_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {result.references && result.references.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ExternalLink className="w-6 h-6 text-primary" />
              </div>
              {isTrue ? 'Reliable Sources' : 'Debunking References'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.references.map((ref, index) => (
                <li key={index} className="text-base text-muted-foreground flex items-start gap-2 leading-relaxed">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};